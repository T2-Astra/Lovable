import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertProjectSchema, insertConversationSchema, insertCodeFileSchema } from "@shared/schema";
import type { GenerateCodeRequest } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Projects
  app.get("/api/projects", async (_req, res) => {
    try {
      const projects = await storage.getAllProjects();
      res.json(projects);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch projects" });
    }
  });

  app.post("/api/projects", async (req, res) => {
    try {
      const validatedData = insertProjectSchema.parse(req.body);
      const project = await storage.createProject(validatedData);
      res.json(project);
    } catch (error) {
      res.status(400).json({ error: "Invalid project data" });
    }
  });

  app.delete("/api/projects/:id", async (req, res) => {
    try {
      await storage.deleteProject(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete project" });
    }
  });

  // Conversations
  app.get("/api/conversations/:projectId", async (req, res) => {
    try {
      const conversations = await storage.getConversationsByProject(req.params.projectId);
      res.json(conversations);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch conversations" });
    }
  });

  app.post("/api/conversations", async (req, res) => {
    try {
      const validatedData = insertConversationSchema.parse(req.body);
      const conversation = await storage.createConversation(validatedData);
      res.json(conversation);
    } catch (error) {
      res.status(400).json({ error: "Invalid conversation data" });
    }
  });

  // Code Files
  app.get("/api/code-files/:projectId", async (req, res) => {
    try {
      const files = await storage.getCodeFilesByProject(req.params.projectId);
      res.json(files);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch code files" });
    }
  });

  app.post("/api/code-files", async (req, res) => {
    try {
      const validatedData = insertCodeFileSchema.parse(req.body);
      const codeFile = await storage.createCodeFile(validatedData);
      res.json(codeFile);
    } catch (error) {
      res.status(400).json({ error: "Invalid code file data" });
    }
  });

  // AI Code Generation - Streaming endpoint
  app.post("/api/generate", async (req, res) => {
    try {
      const { prompt, projectId }: GenerateCodeRequest = req.body;

      if (!prompt || prompt.trim().length === 0) {
        res.status(400).json({ error: "Prompt is required" });
        return;
      }

      // Set headers for Server-Sent Events
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      const apiKey = process.env.GROQ_API_KEY || process.env.OPENROUTER_API_KEY;
      const apiEndpoint = process.env.GROQ_API_KEY 
        ? 'https://api.groq.com/openai/v1/chat/completions'
        : 'https://openrouter.ai/api/v1/chat/completions';
      console.log('API Key check:', apiKey ? 'Present' : 'Missing');
      console.log('Using endpoint:', apiEndpoint);
      if (!apiKey) {
        res.write(`data: ${JSON.stringify({ error: "API key not configured. Add GROQ_API_KEY or OPENROUTER_API_KEY" })}\n\n`);
        res.end();
        return;
      }

      // Create or get project
      let currentProjectId = projectId;
      if (!currentProjectId) {
        const project = await storage.createProject({
          name: `Project ${new Date().toLocaleDateString()}`,
          description: prompt.substring(0, 100),
        });
        currentProjectId = project.id;
        res.write(`data: ${JSON.stringify({ type: 'project', projectId: currentProjectId })}\n\n`);
      }

      // Save user message
      await storage.createConversation({
        projectId: currentProjectId,
        role: 'user',
        content: prompt,
      });

      // Get existing files for context (if any)
      const existingFiles = await storage.getCodeFilesByProject(currentProjectId);
      let contextMessage = '';
      
      if (existingFiles.length > 0) {
        contextMessage = '\n\nEXISTING CODE CONTEXT:\n';
        for (const file of existingFiles) {
          contextMessage += `\n--- ${file.filename} ---\n${file.content}\n`;
        }
        contextMessage += '\n\nINSTRUCTION: Analyze the existing code above and make ONLY the specific changes requested. Do NOT rewrite the entire code. Keep all existing functionality and structure intact.';
      }

      // Call AI API (Groq or OpenRouter)
      const model = process.env.GROQ_API_KEY 
        ? 'llama-3.1-8b-instant' // Groq's model
        : 'openai/gpt-4-turbo'; // OpenRouter - Best for coding, good cost efficiency
        // Alternative options:
        // : 'openai/gpt-3.5-turbo';   // Cheapest but less capable for complex code
        // : 'openai/gpt-4';           // Good balance
        // : 'openai/gpt-4o-mini';     // Original (more expensive)
      
      const headers: Record<string, string> = {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      };
      
      // Add OpenRouter-specific headers only if using OpenRouter
      if (!process.env.GROQ_API_KEY) {
        headers['HTTP-Referer'] = 'https://astra-clone.replit.app';
        headers['X-Title'] = 'Astra Clone';
      }

      const openRouterResponse = await fetch(apiEndpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model,
          max_tokens: 1400, // Optimized for coding tasks with GPT-4-turbo
          messages: [
            {
              role: 'system',
              content: `You are an expert web developer. ALWAYS create separate files for HTML, CSS, and JavaScript.

CRITICAL: Return ONLY valid JSON in this EXACT format (no markdown, no extra text):
{"explanation":"brief description","files":[{"filename":"index.html","content":"HTML code here","language":"html"},{"filename":"styles.css","content":"CSS code here","language":"css"},{"filename":"script.js","content":"JS code here","language":"javascript"}]}

MODIFICATION RULES (VERY IMPORTANT):
1. If EXISTING CODE CONTEXT is provided, you MUST analyze it carefully
2. Make ONLY the specific changes requested - DO NOT rewrite everything
3. Keep all existing functionality, structure, and working code intact
4. Only modify the parts that need to change based on the request
5. Preserve existing class names, IDs, and structure unless specifically asked to change them
6. Add new features without breaking existing ones

CREATION RULES (for new projects):
1. ALWAYS create 3 files: index.html, styles.css, script.js
2. Link CSS with: <link rel="stylesheet" href="styles.css">
3. Link JS with: <script src="script.js"></script>
4. Use modern, clean, semantic HTML5
5. Include responsive CSS

Return ONLY the JSON object, nothing else.`
            },
            {
              role: 'user',
              content: prompt + contextMessage
            }
          ],
          stream: true,
        }),
      });

      if (!openRouterResponse.ok) {
        const errorText = await openRouterResponse.text();
        console.error('OpenRouter API error:', errorText);
        res.write(`data: ${JSON.stringify({ error: `OpenRouter API error: ${errorText}` })}\n\n`);
        res.end();
        return;
      }

      const reader = openRouterResponse.body?.getReader();
      const decoder = new TextDecoder();
      let accumulatedContent = '';

      if (!reader) {
        res.write(`data: ${JSON.stringify({ error: "Failed to read response stream" })}\n\n`);
        res.end();
        return;
      }

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;

            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) {
                accumulatedContent += content;
                res.write(`data: ${JSON.stringify({ type: 'chunk', content })}\n\n`);
              }
            } catch (e) {
              // Ignore parse errors for incomplete chunks
            }
          }
        }
      }

      // Parse the accumulated response
      try {
        let saved = false;
        
        // First, try to parse as JSON
        try {
          // Remove any markdown and clean the response
          let cleanedContent = accumulatedContent
            .replace(/```json\s*/g, '')
            .replace(/```\s*/g, '')
            .trim();
          
          // Try to find a complete JSON object
          let jsonStr = '';
          let braceCount = 0;
          let inString = false;
          let escaped = false;
          let startIndex = cleanedContent.indexOf('{');
          
          if (startIndex !== -1) {
            for (let i = startIndex; i < cleanedContent.length; i++) {
              const char = cleanedContent[i];
              jsonStr += char;
              
              if (escaped) {
                escaped = false;
                continue;
              }
              
              if (char === '\\') {
                escaped = true;
                continue;
              }
              
              if (char === '"') {
                inString = !inString;
                continue;
              }
              
              if (!inString) {
                if (char === '{') braceCount++;
                if (char === '}') braceCount--;
                
                if (braceCount === 0) break;
              }
            }
          }
          
          if (jsonStr && braceCount === 0) {
            // Handle escaped unicode characters only (not newlines/tabs)
            jsonStr = jsonStr
              .replace(/\\u0022/g, '"')
              .replace(/\\u0027/g, "'");
            
            console.log('Attempting to parse JSON:', jsonStr.substring(0, 200) + '...');
            const parsedResponse = JSON.parse(jsonStr);
            
            // Decode escaped characters in file content before saving
            if (parsedResponse.files && Array.isArray(parsedResponse.files)) {
              parsedResponse.files = parsedResponse.files.map((file: any) => ({
                ...file,
                content: file.content
                  .replace(/\\n/g, '\n')
                  .replace(/\\t/g, '\t')
                  .replace(/\\r/g, '\r')
              }));
            }
            
            // Save AI response
            await storage.createConversation({
              projectId: currentProjectId,
              role: 'assistant',
              content: parsedResponse.explanation || 'Generated code successfully',
            });

            // Save generated files (always update existing files)
            if (parsedResponse.files && Array.isArray(parsedResponse.files)) {
              for (const file of parsedResponse.files) {
                const existingFile = await storage.getCodeFileByProjectAndFilename(
                  currentProjectId,
                  file.filename
                );
                
                if (existingFile) {
                  // Update existing file
                  console.log(`Updating existing file: ${file.filename}`);
                  await storage.updateCodeFile(existingFile.id, file.content);
                } else {
                  // Create new file only if it doesn't exist
                  console.log(`Creating new file: ${file.filename}`);
                  await storage.createCodeFile({
                    projectId: currentProjectId,
                    filename: file.filename,
                    content: file.content,
                    language: file.language || 'html',
                  });
                }
              }
              saved = true;
            }
          }
        } catch (jsonError) {
          // Not JSON, continue to HTML parsing
        }

        // If not saved as JSON, try as plain HTML
        if (!saved) {
          let htmlContent = accumulatedContent
            .replace(/```html\s*/g, '')
            .replace(/```\s*/g, '')
            .trim();
          
          if (!htmlContent.includes('<!DOCTYPE') && !htmlContent.includes('<html')) {
            htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Generated App</title>
  <style>
    body { font-family: system-ui, sans-serif; padding: 20px; max-width: 1200px; margin: 0 auto; }
  </style>
</head>
<body>
  ${htmlContent}
</body>
</html>`;
          }
          
          await storage.createConversation({
            projectId: currentProjectId,
            role: 'assistant',
            content: 'Generated code successfully',
          });

          const existingFile = await storage.getCodeFileByProjectAndFilename(
            currentProjectId,
            'index.html'
          );
          
          if (existingFile) {
            await storage.updateCodeFile(existingFile.id, htmlContent);
          } else {
            await storage.createCodeFile({
              projectId: currentProjectId,
              filename: 'index.html',
              content: htmlContent,
              language: 'html',
            });
          }
        }

        res.write(`data: ${JSON.stringify({ type: 'complete', projectId: currentProjectId })}\n\n`);
      } catch (parseError) {
        console.error('Failed to parse AI response:', parseError);
        res.write(`data: ${JSON.stringify({ error: "Failed to parse AI response" })}\n\n`);
      }

      res.end();
    } catch (error) {
      console.error('Generation error:', error);
      res.write(`data: ${JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" })}\n\n`);
      res.end();
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
