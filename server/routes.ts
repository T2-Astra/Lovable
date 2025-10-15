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

      const apiKey = process.env.OPENROUTER_API_KEY;
      if (!apiKey) {
        res.write(`data: ${JSON.stringify({ error: "OpenRouter API key not configured" })}\n\n`);
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

      // Call OpenRouter API
      const openRouterResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://lovable-clone.replit.app',
          'X-Title': 'Lovable Clone',
        },
        body: JSON.stringify({
          model: 'anthropic/claude-3.5-sonnet',
          messages: [
            {
              role: 'system',
              content: 'You are an expert web developer. Generate clean, modern, production-ready HTML, CSS, and JavaScript code based on user requests. Always provide complete, working code that can be directly used. Format your response as JSON with this structure: { "explanation": "brief explanation", "files": [{ "filename": "index.html", "content": "...", "language": "html" }] }'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          stream: true,
        }),
      });

      if (!openRouterResponse.ok) {
        const errorText = await openRouterResponse.text();
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
        // Try to extract JSON from the response
        const jsonMatch = accumulatedContent.match(/\{[\s\S]*"files"[\s\S]*\}/);
        if (jsonMatch) {
          const parsedResponse = JSON.parse(jsonMatch[0]);
          
          // Save AI response
          await storage.createConversation({
            projectId: currentProjectId,
            role: 'assistant',
            content: parsedResponse.explanation || accumulatedContent,
          });

          // Save generated files
          if (parsedResponse.files && Array.isArray(parsedResponse.files)) {
            for (const file of parsedResponse.files) {
              await storage.createCodeFile({
                projectId: currentProjectId,
                filename: file.filename,
                content: file.content,
                language: file.language || 'html',
              });
            }
          }

          res.write(`data: ${JSON.stringify({ type: 'complete', projectId: currentProjectId })}\n\n`);
        } else {
          // If no structured response, create a simple HTML file
          await storage.createConversation({
            projectId: currentProjectId,
            role: 'assistant',
            content: 'Generated code based on your request.',
          });

          await storage.createCodeFile({
            projectId: currentProjectId,
            filename: 'index.html',
            content: `<!DOCTYPE html>\n<html>\n<head>\n  <title>Generated App</title>\n  <style>\n    body { font-family: system-ui, sans-serif; padding: 20px; }\n  </style>\n</head>\n<body>\n  <h1>Your App</h1>\n  <p>${accumulatedContent}</p>\n</body>\n</html>`,
            language: 'html',
          });

          res.write(`data: ${JSON.stringify({ type: 'complete', projectId: currentProjectId })}\n\n`);
        }
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
