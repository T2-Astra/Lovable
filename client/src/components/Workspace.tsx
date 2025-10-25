import { useState, useEffect, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { FileTree } from "./FileTree";
import { CodeEditor } from "./CodeEditor";
import { PreviewPanel } from "./PreviewPanel";
import { PromptInput } from "./PromptInput";
import { GenerationProgress } from "./GenerationProgress";
import { EmptyState } from "./EmptyState";
import { ThemeToggle } from "./ThemeToggle";
import { ProjectHistory } from "./ProjectHistory";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sparkles, FolderTree, FileCode, Eye, ChevronLeft, ChevronRight, Save, History } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { WebContainerManager } from "@/lib/webcontainer";
import type { ProjectFile, GenerationProgress as ProgressType, GenerationResponse, Template, Project } from "@shared/schema";

interface WorkspaceProps {
  onGenerate: (prompt: string, template?: string) => Promise<GenerationResponse>;
  generatedProject?: GenerationResponse | null;
  isGenerating?: boolean;
  streamingStatus?: string;
  streamingFileName?: string;
  streamingProgress?: number;
  selectedTemplate?: Template['id'];
  onTemplateChange?: (templateId?: Template['id']) => void;
}

export function Workspace({ 
  onGenerate, 
  generatedProject, 
  isGenerating: externalIsGenerating,
  streamingStatus,
  streamingFileName,
  streamingProgress,
  selectedTemplate,
  onTemplateChange
}: WorkspaceProps) {
  const [files, setFiles] = useState<ProjectFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<ProjectFile | undefined>();
  const [progress, setProgress] = useState<ProgressType | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>();
  const [showPrompt, setShowPrompt] = useState(true);
  const [leftPanelCollapsed, setLeftPanelCollapsed] = useState(false);
  const [useWebContainer, setUseWebContainer] = useState(false);
  const [webContainerError, setWebContainerError] = useState<string>();
  const [modifiedFiles, setModifiedFiles] = useState<Set<string>>(new Set());
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [currentProjectData, setCurrentProjectData] = useState<GenerationResponse | null>(null);
  
  const { toast } = useToast();
  const webContainerRef = useRef<WebContainerManager | null>(null);
  const isGenerating = externalIsGenerating || false;
  const hasProject = files.length > 0;
  
  // Initialize WebContainer manager once
  useEffect(() => {
    if (!webContainerRef.current) {
      webContainerRef.current = new WebContainerManager();
    }
    
    return () => {
      // Cleanup on unmount
      if (webContainerRef.current) {
        webContainerRef.current.teardown();
      }
    };
  }, []);
  
  // Determine if project needs WebContainer
  const needsWebContainer = (project: GenerationResponse): boolean => {
    const { files, dependencies } = project;
    
    // Has npm dependencies
    if (Object.keys(dependencies).length > 0) {
      return true;
    }
    
    // Has TypeScript or JSX files
    const hasTypeScript = files.some(f => 
      f.language === 'typescript' || 
      f.path.endsWith('.tsx') || 
      f.path.endsWith('.ts') ||
      f.path.endsWith('.jsx')
    );
    if (hasTypeScript) {
      return true;
    }
    
    // Has build config files
    const hasBuildConfig = files.some(f => 
      f.path.includes('package.json') || 
      f.path.includes('vite.config') || 
      f.path.includes('next.config') ||
      f.path.includes('tsconfig.json')
    );
    if (hasBuildConfig) {
      return true;
    }
    
    return false;
  };
  
  // Setup WebContainer when project is generated
  const setupWebContainerProject = async (project: GenerationResponse) => {
    if (!webContainerRef.current) {
      setWebContainerError('WebContainer not initialized');
      return;
    }

    try {
      setWebContainerError(undefined);
      
      // Setup the project in WebContainer
      const serverUrl = await webContainerRef.current.setupProject(
        project.files,
        'npm run dev'
      );
      
      setPreviewUrl(serverUrl);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to setup WebContainer';
      console.error('WebContainer setup error:', error);
      setWebContainerError(errorMessage);
      
      // Fallback to simple preview on error
      setUseWebContainer(false);
      setPreviewUrl('/api/preview');
    }
  };
  
  // Update files when project is generated
  useEffect(() => {
    if (generatedProject) {
      setFiles(generatedProject.files);
      setCurrentProjectData(generatedProject);
      setShowPrompt(false);
      if (generatedProject.files.length > 0) {
        setSelectedFile(generatedProject.files[0]);
      }
      
      // Determine preview method
      const needsContainer = needsWebContainer(generatedProject);
      setUseWebContainer(needsContainer);
      
      if (needsContainer) {
        // Use WebContainer for complex projects
        setupWebContainerProject(generatedProject);
      } else {
        // Use simple preview for static HTML/CSS/JS
        setPreviewUrl('/api/preview');
      }
      
      // Mark generation as complete
      setProgress({
        step: 'complete',
        progress: 100,
        complete: true
      });
      
      // Auto-close progress after a delay
      setTimeout(() => {
        setProgress(null);
      }, 2000);
    }
  }, [generatedProject]);
  
  // Show progress during generation using streaming data
  useEffect(() => {
    if (isGenerating) {
      setShowPrompt(false);
      setProgress({
        step: streamingStatus || 'Starting...',
        currentFile: streamingFileName,
        progress: streamingProgress || 0,
        complete: false
      });
    } else if (!isGenerating && progress && !progress.complete) {
      setProgress(null);
    }
  }, [isGenerating, streamingStatus, streamingFileName, streamingProgress]);
  
  const handleGenerate = async (prompt: string, template?: string) => {
    try {
      await onGenerate(prompt, template);
    } catch (error) {
      console.error("Generation failed:", error);
      setProgress(null);
      setShowPrompt(true);
    }
  };
  
  const handleCancelGeneration = () => {
    setProgress(null);
    if (!hasProject) {
      setShowPrompt(true);
    }
  };
  
  const handleUpdateFile = async (file: ProjectFile, newContent: string) => {
    // Update the file in the files array
    const updatedFiles = files.map(f => 
      f.path === file.path ? { ...f, content: newContent } : f
    );
    setFiles(updatedFiles);
    
    // Update selected file if it's the one being edited
    if (selectedFile?.path === file.path) {
      setSelectedFile({ ...file, content: newContent });
    }
    
    // Mark file as modified
    setModifiedFiles(prev => new Set(prev).add(file.path));
    
    // Sync to WebContainer if active
    if (useWebContainer && webContainerRef.current) {
      try {
        await webContainerRef.current.updateFile(file.path, newContent);
      } catch (error) {
        console.error('Failed to sync file to WebContainer:', error);
      }
    }
  };

  const saveMutation = useMutation({
    mutationFn: async ({ name, templateId }: { name: string; templateId?: string }) => {
      return await apiRequest('POST', '/api/projects/save', { name, templateId });
    },
    onSuccess: () => {
      setShowSaveDialog(false);
      setProjectName("");
      toast({
        title: "Project saved",
        description: "Your project has been saved to history.",
      });
    },
    onError: (error) => {
      toast({
        title: "Save failed",
        description: error instanceof Error ? error.message : "Failed to save project",
        variant: "destructive",
      });
    },
  });
  
  const handleSaveProject = () => {
    setShowSaveDialog(true);
    if (currentProjectData) {
      const defaultName = currentProjectData.projectName || 
        (currentProjectData.description?.substring(0, 50) || 'Untitled Project');
      setProjectName(defaultName);
    }
  };
  
  const handleConfirmSave = () => {
    if (!projectName.trim()) {
      toast({
        title: "Name required",
        description: "Please enter a project name",
        variant: "destructive",
      });
      return;
    }
    saveMutation.mutate({ 
      name: projectName.trim(), 
      templateId: selectedTemplate 
    });
  };
  
  const handleLoadProject = (project: Project) => {
    const projectData: GenerationResponse = {
      files: project.files,
      dependencies: project.dependencies,
      projectName: project.name,
      description: project.prompt,
    };
    
    setFiles(project.files);
    setCurrentProjectData(projectData);
    setShowPrompt(false);
    if (project.files.length > 0) {
      setSelectedFile(project.files[0]);
    }
    
    const needsContainer = needsWebContainer(projectData);
    setUseWebContainer(needsContainer);
    
    if (needsContainer) {
      setupWebContainerProject(projectData);
    } else {
      setPreviewUrl('/api/preview');
    }
    
    setModifiedFiles(new Set());
  };

  const handleNewProject = async () => {
    if (useWebContainer && webContainerRef.current) {
      try {
        await webContainerRef.current.teardown();
      } catch (error) {
        console.error('Failed to teardown WebContainer:', error);
      }
    }
    
    setFiles([]);
    setSelectedFile(undefined);
    setPreviewUrl(undefined);
    setShowPrompt(true);
    setProgress(null);
    setUseWebContainer(false);
    setWebContainerError(undefined);
    setModifiedFiles(new Set());
    setCurrentProjectData(null);
  };
  
  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-3 border-b border-border bg-card">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-foreground">AI Website Builder</h1>
            <p className="text-xs text-muted-foreground">Build with intelligence</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {hasProject && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSaveProject}
                className="gap-2"
                data-testid="button-save-project"
              >
                <Save className="w-3.5 h-3.5" />
                Save Project
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowHistory(true)}
                className="gap-2"
                data-testid="button-history"
              >
                <History className="w-3.5 h-3.5" />
                History
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleNewProject}
                className="gap-2"
                data-testid="button-new-project"
              >
                <Sparkles className="w-3.5 h-3.5" />
                New Project
              </Button>
            </>
          )}
          <ThemeToggle />
        </div>
      </header>
      
      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        {!hasProject && showPrompt ? (
          <PromptInput 
            onGenerate={handleGenerate}
            isGenerating={isGenerating}
            selectedTemplate={selectedTemplate}
            onTemplateChange={onTemplateChange}
          />
        ) : showPrompt ? (
          <div className="h-full overflow-auto">
            <PromptInput 
              onGenerate={handleGenerate}
              isGenerating={isGenerating}
              selectedTemplate={selectedTemplate}
              onTemplateChange={onTemplateChange}
            />
          </div>
        ) : (
          <div className="h-full flex">
            {/* Left Panel - File Explorer */}
            <div className={`
              border-r border-border bg-sidebar transition-all duration-300 flex-shrink-0
              ${leftPanelCollapsed ? 'w-0' : 'w-64'}
            `}>
              {!leftPanelCollapsed && (
                <div className="h-full flex flex-col">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-sidebar-border">
                    <div className="flex items-center gap-2 text-sm font-medium text-sidebar-foreground">
                      <FolderTree className="w-4 h-4" />
                      Files
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setLeftPanelCollapsed(true)}
                      className="h-7 w-7 p-0"
                      data-testid="button-collapse-left"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <FileTree
                      files={files}
                      onFileSelect={setSelectedFile}
                      selectedFile={selectedFile?.path}
                      modifiedFiles={modifiedFiles}
                    />
                  </div>
                </div>
              )}
            </div>
            
            {leftPanelCollapsed && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLeftPanelCollapsed(false)}
                className="absolute left-0 top-20 z-10 h-8 w-8 p-0 rounded-r-md rounded-l-none border border-l-0"
                data-testid="button-expand-left"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            )}
            
            {/* Center Panel - Code Editor */}
            <div className="flex-1 flex flex-col min-w-0">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-card">
                <FileCode className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">Code</span>
              </div>
              <div className="flex-1 overflow-hidden">
                <CodeEditor 
                  file={selectedFile} 
                  onSave={handleUpdateFile}
                  modifiedFiles={modifiedFiles}
                />
              </div>
            </div>
            
            {/* Right Panel - Preview */}
            <div className="flex-1 flex flex-col min-w-0 border-l border-border">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-card">
                <Eye className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">Preview</span>
              </div>
              <div className="flex-1 overflow-hidden">
                <PreviewPanel
                  previewUrl={previewUrl}
                  isLoading={isGenerating}
                  error={webContainerError}
                  webContainer={webContainerRef.current || undefined}
                  useWebContainer={useWebContainer}
                />
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Generation Progress Overlay */}
      {progress && !progress.complete && (
        <GenerationProgress
          progress={progress}
          onCancel={handleCancelGeneration}
        />
      )}
      
      {/* Save Project Dialog */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent data-testid="dialog-save-project">
          <DialogHeader>
            <DialogTitle>Save Project</DialogTitle>
            <DialogDescription>
              Enter a name for your project to save it to history
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="project-name">Project Name</Label>
            <Input
              id="project-name"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="My Awesome Project"
              className="mt-2"
              data-testid="input-project-name"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleConfirmSave();
                }
              }}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowSaveDialog(false)}
              data-testid="button-cancel-save"
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmSave}
              disabled={saveMutation.isPending}
              data-testid="button-confirm-save"
            >
              {saveMutation.isPending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Project History Panel */}
      <ProjectHistory
        open={showHistory}
        onOpenChange={setShowHistory}
        onLoadProject={handleLoadProject}
      />
    </div>
  );
}
