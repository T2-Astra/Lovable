import { useState, useEffect } from "react";
import { FileTree } from "./FileTree";
import { CodeEditor } from "./CodeEditor";
import { PreviewPanel } from "./PreviewPanel";
import { PromptInput } from "./PromptInput";
import { GenerationProgress } from "./GenerationProgress";
import { EmptyState } from "./EmptyState";
import { ThemeToggle } from "./ThemeToggle";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Sparkles, FolderTree, FileCode, Eye, ChevronLeft, ChevronRight } from "lucide-react";
import type { ProjectFile, GenerationProgress as ProgressType, GenerationResponse } from "@shared/schema";

interface WorkspaceProps {
  onGenerate: (prompt: string, template?: string) => Promise<GenerationResponse>;
  generatedProject?: GenerationResponse | null;
  isGenerating?: boolean;
}

export function Workspace({ onGenerate, generatedProject, isGenerating: externalIsGenerating }: WorkspaceProps) {
  const [files, setFiles] = useState<ProjectFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<ProjectFile | undefined>();
  const [progress, setProgress] = useState<ProgressType | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>();
  const [showPrompt, setShowPrompt] = useState(true);
  const [leftPanelCollapsed, setLeftPanelCollapsed] = useState(false);
  
  const isGenerating = externalIsGenerating || false;
  const hasProject = files.length > 0;
  
  // Update files when project is generated
  useEffect(() => {
    if (generatedProject) {
      setFiles(generatedProject.files);
      setShowPrompt(false);
      if (generatedProject.files.length > 0) {
        setSelectedFile(generatedProject.files[0]);
      }
      // Use the preview API endpoint for better compatibility
      setPreviewUrl('/api/preview');
      
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
  
  // Show progress during generation
  useEffect(() => {
    if (isGenerating && !progress) {
      setShowPrompt(false);
      setProgress({
        step: 'analyzing',
        progress: 10,
        complete: false
      });
      
      const steps = [
        { step: 'planning', progress: 30, delay: 1000 },
        { step: 'generating', progress: 60, delay: 2000 },
        { step: 'dependencies', progress: 85, delay: 3000 }
      ];
      
      steps.forEach(({ step, progress: prog, delay }) => {
        setTimeout(() => {
          if (isGenerating) {
            setProgress({
              step,
              currentFile: step === 'generating' ? 'index.html' : undefined,
              progress: prog,
              complete: false
            });
          }
        }, delay);
      });
    }
  }, [isGenerating]);
  
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
  
  const handleNewProject = () => {
    setFiles([]);
    setSelectedFile(undefined);
    setPreviewUrl(undefined);
    setShowPrompt(true);
    setProgress(null);
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
          />
        ) : showPrompt ? (
          <div className="h-full overflow-auto">
            <PromptInput 
              onGenerate={handleGenerate}
              isGenerating={isGenerating}
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
                <CodeEditor file={selectedFile} />
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
    </div>
  );
}
