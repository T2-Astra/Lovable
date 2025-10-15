import { 
  type Project, 
  type InsertProject,
  type Conversation,
  type InsertConversation,
  type CodeFile,
  type InsertCodeFile
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Projects
  createProject(project: InsertProject): Promise<Project>;
  getProject(id: string): Promise<Project | undefined>;
  getAllProjects(): Promise<Project[]>;
  deleteProject(id: string): Promise<void>;
  
  // Conversations
  createConversation(conversation: InsertConversation): Promise<Conversation>;
  getConversationsByProject(projectId: string): Promise<Conversation[]>;
  
  // Code Files
  createCodeFile(codeFile: InsertCodeFile): Promise<CodeFile>;
  getCodeFilesByProject(projectId: string): Promise<CodeFile[]>;
  updateCodeFile(id: string, content: string): Promise<CodeFile | undefined>;
  deleteCodeFilesByProject(projectId: string): Promise<void>;
}

export class MemStorage implements IStorage {
  private projects: Map<string, Project>;
  private conversations: Map<string, Conversation>;
  private codeFiles: Map<string, CodeFile>;

  constructor() {
    this.projects = new Map();
    this.conversations = new Map();
    this.codeFiles = new Map();
  }

  // Projects
  async createProject(insertProject: InsertProject): Promise<Project> {
    const id = randomUUID();
    const now = new Date();
    const project: Project = {
      id,
      name: insertProject.name,
      description: insertProject.description ?? null,
      createdAt: now,
      updatedAt: now,
    };
    this.projects.set(id, project);
    return project;
  }

  async getProject(id: string): Promise<Project | undefined> {
    return this.projects.get(id);
  }

  async getAllProjects(): Promise<Project[]> {
    return Array.from(this.projects.values()).sort(
      (a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()
    );
  }

  async deleteProject(id: string): Promise<void> {
    this.projects.delete(id);
    await this.deleteCodeFilesByProject(id);
    
    // Delete conversations
    const conversations = Array.from(this.conversations.values()).filter(
      c => c.projectId === id
    );
    conversations.forEach(c => this.conversations.delete(c.id));
  }

  // Conversations
  async createConversation(insertConversation: InsertConversation): Promise<Conversation> {
    const id = randomUUID();
    const conversation: Conversation = {
      ...insertConversation,
      id,
      timestamp: new Date(),
    };
    this.conversations.set(id, conversation);
    return conversation;
  }

  async getConversationsByProject(projectId: string): Promise<Conversation[]> {
    return Array.from(this.conversations.values())
      .filter(c => c.projectId === projectId)
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  // Code Files
  async createCodeFile(insertCodeFile: InsertCodeFile): Promise<CodeFile> {
    const id = randomUUID();
    const codeFile: CodeFile = {
      ...insertCodeFile,
      id,
      updatedAt: new Date(),
    };
    this.codeFiles.set(id, codeFile);
    return codeFile;
  }

  async getCodeFilesByProject(projectId: string): Promise<CodeFile[]> {
    return Array.from(this.codeFiles.values())
      .filter(f => f.projectId === projectId)
      .sort((a, b) => a.filename.localeCompare(b.filename));
  }

  async updateCodeFile(id: string, content: string): Promise<CodeFile | undefined> {
    const file = this.codeFiles.get(id);
    if (!file) return undefined;
    
    const updated: CodeFile = {
      ...file,
      content,
      updatedAt: new Date(),
    };
    this.codeFiles.set(id, updated);
    return updated;
  }

  async deleteCodeFilesByProject(projectId: string): Promise<void> {
    const files = Array.from(this.codeFiles.values()).filter(
      f => f.projectId === projectId
    );
    files.forEach(f => this.codeFiles.delete(f.id));
  }
}

export const storage = new MemStorage();
