import { type User, type InsertUser, type ProjectFile, type GenerationResponse } from "@shared/schema";
import { randomUUID } from "crypto";

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Project storage (in-memory, session-based)
  saveProject(sessionId: string, project: GenerationResponse): Promise<void>;
  getProject(sessionId: string): Promise<GenerationResponse | undefined>;
  clearProject(sessionId: string): Promise<void>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private projects: Map<string, GenerationResponse>;

  constructor() {
    this.users = new Map();
    this.projects = new Map();
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
  
  async saveProject(sessionId: string, project: GenerationResponse): Promise<void> {
    this.projects.set(sessionId, project);
  }
  
  async getProject(sessionId: string): Promise<GenerationResponse | undefined> {
    return this.projects.get(sessionId);
  }
  
  async clearProject(sessionId: string): Promise<void> {
    this.projects.delete(sessionId);
  }
}

export const storage = new MemStorage();
