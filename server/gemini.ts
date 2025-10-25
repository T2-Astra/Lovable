import { GoogleGenAI } from "@google/genai";
import type { ProjectFile, Template } from "@shared/schema";
import { TEMPLATES } from "@shared/schema";

// DON'T DELETE THIS COMMENT
// Follow these instructions when using this blueprint:
// - Note that the newest Gemini model series is "gemini-2.5-flash" or gemini-2.5-pro"
//   - do not change this unless explicitly requested by the user

// This API key is from Gemini Developer API Key, not vertex AI API Key
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

const SYSTEM_PROMPT = `You are an expert full-stack web developer and code generator. Your task is to generate complete, production-ready web applications based on user prompts.

When generating code:
1. Create a well-structured project with proper file organization
2. Use modern best practices and clean code principles
3. Include all necessary files (HTML, CSS, JavaScript/TypeScript, config files)
4. Add helpful comments but keep code concise
5. Ensure responsive design and accessibility
6. Use semantic HTML and proper CSS organization
7. Generate working, functional code that runs without errors

Response format:
Generate a JSON object with this exact structure:
{
  "projectName": "string (kebab-case)",
  "description": "brief description",
  "files": [
    {
      "path": "relative/path/to/file.ext",
      "content": "full file content",
      "language": "javascript|typescript|html|css|json|markdown"
    }
  ],
  "dependencies": {
    "package-name": "version"
  }
}

Generate complete, working code. Do not use placeholders or TODO comments.`;

// Template-specific instructions for Gemini
const TEMPLATE_INSTRUCTIONS: Record<string, string> = {
  'react-vite': 'Create a React application using Vite as the build tool. Use TypeScript and modern React patterns with hooks. Include proper component structure, use functional components with hooks, and follow React best practices. Set up Vite configuration and include all necessary files.',
  'nextjs': 'Create a Next.js application using the App Router (app directory). Use TypeScript and follow Next.js 14+ best practices. Include proper page structure, layouts, and server/client components as appropriate. Follow the App Router conventions and include all necessary Next.js configuration files.',
  'vanilla': 'Create a simple web application using pure HTML, CSS, and vanilla JavaScript. No build tools, frameworks, or dependencies. Use modern ES6+ JavaScript features. Keep it simple and lightweight with clean, well-organized code.'
};

export async function generateProject(prompt: string, template?: string): Promise<{
  projectName: string;
  description: string;
  files: ProjectFile[];
  dependencies: Record<string, string>;
}> {
  try {
    const templateInstruction = template && TEMPLATE_INSTRUCTIONS[template] 
      ? `\n\nIMPORTANT - Framework Instructions:\n${TEMPLATE_INSTRUCTIONS[template]}` 
      : '';
    const fullPrompt = `${prompt}${templateInstruction}\n\nGenerate a complete web application based on this description. Include all necessary files.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      config: {
        systemInstruction: SYSTEM_PROMPT,
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            projectName: { type: "string" },
            description: { type: "string" },
            files: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  path: { type: "string" },
                  content: { type: "string" },
                  language: { type: "string" }
                },
                required: ["path", "content", "language"]
              }
            }
          },
          required: ["projectName", "description", "files"]
        },
      },
      contents: fullPrompt,
    });

    const rawJson = response.text;

    if (!rawJson) {
      throw new Error("Empty response from Gemini");
    }

    const data = JSON.parse(rawJson);
    
    // Validate the response structure
    if (!data.projectName || !data.files || !Array.isArray(data.files)) {
      throw new Error("Invalid response structure from Gemini");
    }

    // Extract dependencies from file content or use empty object
    const dependencies: Record<string, string> = {};
    const packageJsonFile = data.files.find((f: ProjectFile) => f.path === 'package.json');
    if (packageJsonFile) {
      try {
        const packageJson = JSON.parse(packageJsonFile.content);
        Object.assign(dependencies, packageJson.dependencies || {});
      } catch (e) {
        // Ignore JSON parse errors
      }
    }
    
    return {
      projectName: data.projectName,
      description: data.description || "Generated web application",
      files: data.files,
      dependencies
    };
  } catch (error) {
    console.error("Gemini generation error:", error);
    throw new Error(`Failed to generate project: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function* generateProjectStream(
  prompt: string,
  template?: string
): AsyncGenerator<{type: string; data: any}> {
  try {
    yield { type: 'status', data: { message: 'Analyzing your prompt...' } };
    
    const templateInstruction = template && TEMPLATE_INSTRUCTIONS[template] 
      ? `\n\nIMPORTANT - Framework Instructions:\n${TEMPLATE_INSTRUCTIONS[template]}` 
      : '';
    const fullPrompt = `${prompt}${templateInstruction}\n\nGenerate a complete web application based on this description. Include all necessary files.`;

    yield { type: 'status', data: { message: 'Planning project structure...' } };

    const streamResponse = await ai.models.generateContentStream({
      model: "gemini-2.5-flash",
      config: {
        systemInstruction: SYSTEM_PROMPT,
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            projectName: { type: "string" },
            description: { type: "string" },
            files: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  path: { type: "string" },
                  content: { type: "string" },
                  language: { type: "string" }
                },
                required: ["path", "content", "language"]
              }
            }
          },
          required: ["projectName", "description", "files"]
        },
      },
      contents: fullPrompt,
    });

    yield { type: 'status', data: { message: 'Generating code...' } };
    
    let accumulatedText = '';
    let filesSeen = new Set<string>();
    
    for await (const chunk of streamResponse) {
      if (!chunk || !chunk.text) {
        continue;
      }
      
      const chunkText = chunk.text;
      if (chunkText) {
        accumulatedText += chunkText;
      }
      
      try {
        const partial = JSON.parse(accumulatedText);
        
        if (partial.files && Array.isArray(partial.files)) {
          for (const file of partial.files) {
            if (file.path && !filesSeen.has(file.path)) {
              filesSeen.add(file.path);
              const progress = Math.min(90, 30 + (filesSeen.size * 5));
              yield { 
                type: 'file', 
                data: { 
                  fileName: file.path, 
                  progress 
                } 
              };
            }
          }
        }
      } catch (e) {
        // Partial JSON, continue accumulating
      }
    }

    const finalJson = accumulatedText;
    if (!finalJson) {
      throw new Error("Empty response from Gemini");
    }

    const data = JSON.parse(finalJson);
    
    if (!data.projectName || !data.files || !Array.isArray(data.files)) {
      throw new Error("Invalid response structure from Gemini");
    }

    const dependencies: Record<string, string> = {};
    const packageJsonFile = data.files.find((f: ProjectFile) => f.path === 'package.json');
    if (packageJsonFile) {
      try {
        const packageJson = JSON.parse(packageJsonFile.content);
        Object.assign(dependencies, packageJson.dependencies || {});
      } catch (e) {
        // Ignore JSON parse errors
      }
    }

    const result = {
      projectName: data.projectName,
      description: data.description || "Generated web application",
      files: data.files,
      dependencies
    };

    yield { type: 'status', data: { message: 'Finalizing project...' } };
    yield { type: 'complete', data: { project: result } };
    
  } catch (error) {
    console.error("Gemini streaming error:", error);
    yield { 
      type: 'error', 
      data: { 
        error: error instanceof Error ? error.message : 'Unknown error during generation' 
      } 
    };
  }
}

export async function streamGeneration(
  prompt: string,
  template?: string,
  onProgress?: (step: string, currentFile?: string, progress?: number) => void
): Promise<{
  projectName: string;
  description: string;
  files: ProjectFile[];
  dependencies: Record<string, string>;
}> {
  // Simulate streaming by breaking generation into steps
  onProgress?.('analyzing', undefined, 10);
  await new Promise(resolve => setTimeout(resolve, 500));
  
  onProgress?.('planning', undefined, 25);
  await new Promise(resolve => setTimeout(resolve, 500));
  
  onProgress?.('generating', 'project structure', 40);
  const result = await generateProject(prompt, template);
  
  // Simulate file-by-file generation feedback
  const fileCount = result.files.length;
  for (let i = 0; i < fileCount; i++) {
    const progress = 40 + Math.floor((i / fileCount) * 40);
    onProgress?.('generating', result.files[i].path, progress);
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  onProgress?.('dependencies', undefined, 85);
  await new Promise(resolve => setTimeout(resolve, 500));
  
  onProgress?.('complete', undefined, 100);
  
  return result;
}

// Get available templates
export function getTemplates(): Template[] {
  return TEMPLATES;
}
