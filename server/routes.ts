import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { generateProject, streamGeneration, getTemplates, generateProjectStream } from "./gemini";
import { generationRequestSchema } from "@shared/schema";
import { fromZodError } from "zod-validation-error";
import { generatePreviewHTML, canUseSimplePreview } from "./preview";

export async function registerRoutes(app: Express): Promise<Server> {
  // SSE streaming endpoint for real-time generation
  app.get("/api/generate/stream", async (req, res) => {
    const { prompt, template } = req.query;
    
    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'Prompt is required' });
    }
    
    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();
    
    let streamAborted = false;
    
    // Handle client disconnect
    req.on('close', () => {
      console.log('Client disconnected from SSE stream');
      streamAborted = true;
    });
    
    try {
      const sessionId = req.sessionID || 'default';
      
      for await (const event of generateProjectStream(prompt, template as string | undefined)) {
        // Stop if client disconnected
        if (streamAborted) {
          console.log('Aborting stream due to client disconnect');
          break;
        }
        
        const sseData = `event: ${event.type}\ndata: ${JSON.stringify(event.data)}\n\n`;
        res.write(sseData);
        
        // If complete, save the project
        if (event.type === 'complete' && event.data.project) {
          await storage.saveProject(sessionId, event.data.project);
        }
      }
      
      if (!streamAborted) {
        res.end();
      }
    } catch (error) {
      console.error("SSE streaming error:", error);
      if (!streamAborted) {
        const errorEvent = `event: error\ndata: ${JSON.stringify({ 
          error: error instanceof Error ? error.message : 'Unknown error' 
        })}\n\n`;
        res.write(errorEvent);
        res.end();
      }
    }
  });
  
  // Generate a new project using Gemini AI
  app.post("/api/generate", async (req, res) => {
    try {
      const validation = generationRequestSchema.safeParse(req.body);
      
      if (!validation.success) {
        const error = fromZodError(validation.error);
        return res.status(400).json({ 
          error: "Validation failed", 
          details: error.message 
        });
      }
      
      const { prompt, template } = validation.data;
      
      // Generate the project
      const result = await generateProject(prompt, template);
      
      // Store in session-based storage
      const sessionId = req.sessionID || 'default';
      await storage.saveProject(sessionId, result);
      
      res.json(result);
    } catch (error) {
      console.error("Generation error:", error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : "Failed to generate project" 
      });
    }
  });
  
  // Get available templates
  app.get("/api/templates", async (req, res) => {
    try {
      const templates = getTemplates();
      res.json(templates);
    } catch (error) {
      console.error("Templates error:", error);
      res.status(500).json({ 
        error: "Failed to fetch templates" 
      });
    }
  });
  
  // Get current project
  app.get("/api/project", async (req, res) => {
    try {
      const sessionId = req.sessionID || 'default';
      const project = await storage.getProject(sessionId);
      
      if (!project) {
        return res.status(404).json({ error: "No project found" });
      }
      
      res.json(project);
    } catch (error) {
      console.error("Project fetch error:", error);
      res.status(500).json({ 
        error: "Failed to fetch project" 
      });
    }
  });
  
  // Clear current project
  app.delete("/api/project", async (req, res) => {
    try {
      const sessionId = req.sessionID || 'default';
      await storage.clearProject(sessionId);
      res.json({ success: true });
    } catch (error) {
      console.error("Project clear error:", error);
      res.status(500).json({ 
        error: "Failed to clear project" 
      });
    }
  });
  
  // Get preview HTML for the current project
  app.get("/api/preview", async (req, res) => {
    try {
      const sessionId = req.sessionID || 'default';
      const project = await storage.getProject(sessionId);
      
      if (!project) {
        return res.status(404).send(`
          <!DOCTYPE html>
          <html>
          <head><title>No Preview</title></head>
          <body style="display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; font-family: sans-serif; background: #f5f5f5;">
            <div style="text-align: center;">
              <h2 style="color: #666;">No project generated yet</h2>
              <p style="color: #999;">Generate a project to see the preview</p>
            </div>
          </body>
          </html>
        `);
      }
      
      const html = generatePreviewHTML(project.files);
      res.setHeader('Content-Type', 'text/html');
      res.send(html);
    } catch (error) {
      console.error("Preview error:", error);
      res.status(500).send(`
        <!DOCTYPE html>
        <html>
        <head><title>Preview Error</title></head>
        <body style="display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; font-family: sans-serif; background: #f5f5f5;">
          <div style="text-align: center;">
            <h2 style="color: #e74c3c;">Preview Error</h2>
            <p style="color: #999;">${error instanceof Error ? error.message : 'Unknown error'}</p>
          </div>
        </body>
        </html>
      `);
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
