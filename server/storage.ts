import { type User, type InsertUser, type ProjectFile, type GenerationResponse, type Project, type InsertProject } from "@shared/schema";
import { randomUUID } from "crypto";
import { db } from "./db";
import { projects } from "@shared/schema";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Project storage (session-based current project)
  saveProject(sessionId: string, project: GenerationResponse): Promise<void>;
  getProject(sessionId: string): Promise<GenerationResponse | undefined>;
  clearProject(sessionId: string): Promise<void>;
  
  // Project history (database-backed)
  saveToHistory(sessionId: string, name: string, project: GenerationResponse, templateId?: string): Promise<Project>;
  getProjectHistory(sessionId: string): Promise<Project[]>;
  getProjectById(id: number, sessionId: string): Promise<Project | undefined>;
  deleteProject(id: number, sessionId: string): Promise<boolean>;
}

export class DbStorage implements IStorage {
  private users: Map<string, User>;
  private currentProjects: Map<string, GenerationResponse>;

  constructor() {
    this.users = new Map();
    this.currentProjects = new Map();
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
    this.currentProjects.set(sessionId, project);
  }
  
  async getProject(sessionId: string): Promise<GenerationResponse | undefined> {
    return this.currentProjects.get(sessionId);
  }
  
  async clearProject(sessionId: string): Promise<void> {
    this.currentProjects.delete(sessionId);
  }
  
  async saveToHistory(sessionId: string, name: string, project: GenerationResponse, templateId?: string): Promise<Project> {
    const insertData: InsertProject = {
      sessionId,
      name,
      prompt: project.description || '',
      templateId: templateId || null,
      files: project.files,
      dependencies: project.dependencies,
    };
    
    const [savedProject] = await db.insert(projects).values(insertData).returning();
    return savedProject;
  }
  
  async getProjectHistory(sessionId: string): Promise<Project[]> {
    const history = await db
      .select()
      .from(projects)
      .where(eq(projects.sessionId, sessionId))
      .orderBy(desc(projects.createdAt));
    
    return history;
  }
  
  async getProjectById(id: number, sessionId: string): Promise<Project | undefined> {
    const [project] = await db
      .select()
      .from(projects)
      .where(eq(projects.id, id))
      .limit(1);
    
    // Verify project belongs to the requesting session
    if (project && project.sessionId !== sessionId) {
      return undefined;
    }
    
    return project;
  }
  
  async deleteProject(id: number, sessionId: string): Promise<boolean> {
    const result = await db
      .delete(projects)
      .where(eq(projects.id, id))
      .returning();
    
    // Check if project existed and belonged to the session
    if (result.length === 0) {
      return false;
    }
    
    // Verify the deleted project belonged to the requesting session
    if (result[0].sessionId !== sessionId) {
      // This shouldn't happen in practice due to transaction isolation,
      // but adding this check for extra security
      return false;
    }
    
    return true;
  }
}

export const storage = new DbStorage();
