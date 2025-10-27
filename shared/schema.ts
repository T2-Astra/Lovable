import { sql } from "drizzle-orm";
import { pgTable, text, varchar, jsonb, timestamp, serial } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table (keeping existing structure)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Projects table for saving project history
export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  sessionId: text("session_id").notNull(),
  name: text("name").notNull(),
  prompt: text("prompt").notNull(),
  templateId: text("template_id"),
  files: jsonb("files").notNull().$type<ProjectFile[]>(),
  dependencies: jsonb("dependencies").notNull().$type<Record<string, string>>(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertProjectSchema = createInsertSchema(projects).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertProject = z.infer<typeof insertProjectSchema>;
export type Project = typeof projects.$inferSelect;

// Project generation data structures (in-memory only, no DB)
export interface ProjectFile {
  path: string;
  content: string;
  language: string;
}

export interface GenerationRequest {
  prompt: string;
  template?: 'react-vite' | 'nextjs' | 'html-css-js';
}

export interface GenerationResponse {
  files: ProjectFile[];
  dependencies: Record<string, string>;
  projectName: string;
  description: string;
}

export interface GenerationProgress {
  step: string;
  currentFile?: string;
  progress: number;
  complete: boolean;
}

// Validation schemas
export const generationRequestSchema = z.object({
  prompt: z.string().min(10, "Prompt must be at least 10 characters").max(2000, "Prompt too long"),
  template: z.enum(['react-vite', 'nextjs', 'html-css-js']).optional(),
});

export type ValidatedGenerationRequest = z.infer<typeof generationRequestSchema>;

// Template configurations
export interface Template {
  id: 'react-vite' | 'nextjs' | 'html-css-js';
  name: string;
  description: string;
  icon: string;
  techStack: string[];
  files: ProjectFile[];
  dependencies: Record<string, string>;
}

// Available templates with full details
export const TEMPLATES: Template[] = [
  {
    id: 'react-vite',
    name: 'React + Vite',
    description: 'Modern React application with Vite as the build tool. Lightning-fast HMR and optimized for development.',
    icon: 'react',
    techStack: ['React', 'TypeScript', 'Vite', 'ES Modules'],
    files: [],
    dependencies: {
      'react': '^18.2.0',
      'react-dom': '^18.2.0'
    }
  },
  {
    id: 'nextjs',
    name: 'Next.js App Router',
    description: 'Full-stack React framework with server-side rendering, App Router, and built-in optimizations.',
    icon: 'nextjs',
    techStack: ['Next.js', 'React', 'TypeScript', 'App Router'],
    files: [],
    dependencies: {
      'next': '^14.0.0',
      'react': '^18.2.0',
      'react-dom': '^18.2.0'
    }
  },
  {
    id: 'html-css-js',
    name: 'HTML + CSS + JS',
    description: 'Basic web development with HTML, CSS, and JavaScript. Perfect for learning and simple projects.',
    icon: 'html5',
    techStack: ['HTML5', 'CSS3', 'JavaScript'],
    files: [],
    dependencies: {}
  }
];

// SSE Event Types for streaming
// Note: The 'type' field is sent as the SSE event name, not in the data payload
export interface StatusEventData {
  message: string;
}

export interface FileEventData {
  fileName: string;
  progress: number;
}

export interface CompleteEventData {
  project: GenerationResponse;
}

export interface ErrorEventData {
  error: string;
}

// Full event structure (used internally in generators)
export interface StatusEvent {
  type: 'status';
  data: StatusEventData;
}

export interface FileEvent {
  type: 'file';
  data: FileEventData;
}

export interface CompleteEvent {
  type: 'complete';
  data: CompleteEventData;
}

export interface ErrorEvent {
  type: 'error';
  data: ErrorEventData;
}

export type StreamEvent = StatusEvent | FileEvent | CompleteEvent | ErrorEvent;
