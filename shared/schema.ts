import { sql } from "drizzle-orm";
import { pgTable, text, varchar, jsonb, timestamp } from "drizzle-orm/pg-core";
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

// Project generation data structures (in-memory only, no DB)
export interface ProjectFile {
  path: string;
  content: string;
  language: string;
}

export interface GenerationRequest {
  prompt: string;
  template?: 'react-vite' | 'nextjs' | 'vanilla';
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
  template: z.enum(['react-vite', 'nextjs', 'vanilla']).optional(),
});

export type ValidatedGenerationRequest = z.infer<typeof generationRequestSchema>;

// Template configurations
export interface Template {
  id: string;
  name: string;
  description: string;
  icon: string;
  files: ProjectFile[];
  dependencies: Record<string, string>;
}

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
