import { Router } from 'express';
import { GoogleGenAI } from '@google/genai';
import { z } from 'zod';
import type { ProjectFile } from '../../shared/schema.js';

const router = Router();

const chatModifySchema = z.object({
  message: z.string().min(1, "Message is required"),
  files: z.array(z.object({
    path: z.string(),
    content: z.string(),
    language: z.string(),
  })),
  selectedFile: z.string().optional(),
});

router.post('/modify', async (req, res) => {
  try {
    const { message, files, selectedFile } = chatModifySchema.parse(req.body);
    
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ 
        error: 'Gemini API key not configured' 
      });
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    // Create context about the current project
    const filesList = files.map(f => `${f.path} (${f.language})`).join(', ');
    const currentFileContext = selectedFile 
      ? `\n\nCurrently viewing: ${selectedFile}`
      : '';

    // Create a focused prompt for code modifications
    const prompt = `You are a helpful AI assistant that modifies web project code based on user requests.

User request: "${message}"

Current project files (${files.length} files):
${files.map(f => `\n=== ${f.path} ===\n${f.content.substring(0, 1000)}${f.content.length > 1000 ? '...[truncated]' : ''}`).join('\n')}

Instructions:
1. Understand what the user wants to change
2. Modify the appropriate files
3. Return ONLY valid JSON in this exact format:

{
  "message": "Brief explanation of changes made",
  "updatedFiles": [
    {
      "path": "exact/file/path.ext",
      "content": "complete updated file content",
      "language": "javascript"
    }
  ]
}

Important:
- If no code changes needed, return empty updatedFiles array
- Include complete file content, not just changes
- Ensure all syntax is correct
- Keep the same file structure and imports`;

    const result = await ai.generateContent({
      model: "gemini-2.5-flash",
      prompt: prompt,
    });
    
    const text = result.text;

    // Try to parse JSON response
    let parsedResponse;
    try {
      // Clean the response text
      let cleanText = text.trim();
      
      // Remove markdown code blocks if present
      const jsonMatch = cleanText.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
      if (jsonMatch) {
        cleanText = jsonMatch[1].trim();
      }
      
      // Find JSON object
      const jsonStart = cleanText.indexOf('{');
      const jsonEnd = cleanText.lastIndexOf('}');
      
      if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
        const jsonText = cleanText.substring(jsonStart, jsonEnd + 1);
        parsedResponse = JSON.parse(jsonText);
      } else {
        throw new Error('No valid JSON found');
      }
    } catch (parseError) {
      console.error('JSON parsing error:', parseError);
      console.error('Raw response:', text);
      
      // If JSON parsing fails, return the raw text as message
      parsedResponse = {
        message: text.length > 500 ? text.substring(0, 500) + '...' : text,
        updatedFiles: []
      };
    }

    // Validate and sanitize the response structure
    if (!parsedResponse || typeof parsedResponse !== 'object') {
      parsedResponse = { message: 'Invalid response format', updatedFiles: [] };
    }
    
    if (!parsedResponse.message || typeof parsedResponse.message !== 'string') {
      parsedResponse.message = 'Changes processed successfully';
    }
    
    if (!Array.isArray(parsedResponse.updatedFiles)) {
      parsedResponse.updatedFiles = [];
    }

    res.json(parsedResponse);

  } catch (error) {
    console.error('Chat modify error:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Invalid request data',
        details: error.errors 
      });
    }

    res.status(500).json({ 
      error: 'Failed to process chat request',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export { router as default };
