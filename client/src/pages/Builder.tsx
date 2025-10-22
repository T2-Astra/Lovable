import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation, useSearch } from "wouter";
import { Sparkles, Code2, Play, Download, Copy, Settings, ChevronLeft, ChevronRight, FileCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import CodeEditor from "../components/CodeEditor";
import LivePreview from "../components/LivePreview";
import ConversationHistory from "../components/ConversationHistory";
import { ThemeToggle } from "@/components/ThemeToggle";
import type { Project, Conversation, CodeFile } from "@shared/schema";

export default function Builder() {
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedFile, setSelectedFile] = useState<CodeFile | null>(null);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const searchParams = useSearch();
  const { toast } = useToast();

  // Get project from URL parameter
  useEffect(() => {
    const urlParams = new URLSearchParams(searchParams);
    const projectId = urlParams.get('project');
    if (projectId) {
      setCurrentProjectId(projectId);
    }
  }, [searchParams]);

  const { data: conversations = [] } = useQuery<Conversation[]>({
    queryKey: currentProjectId ? ['/api/conversations', currentProjectId] : [],
    enabled: !!currentProjectId,
  });

  const [editedFiles, setEditedFiles] = useState<Map<string, string>>(new Map());

  const { data: codeFiles = [] } = useQuery<CodeFile[]>({
    queryKey: currentProjectId ? ['/api/code-files', currentProjectId] : [],
    enabled: !!currentProjectId,
  });

  // Merge edited files with fetched files for preview
  const previewFiles = codeFiles.map(file => {
    const editedContent = editedFiles.get(file.id);
    return editedContent ? { ...file, content: editedContent } : file;
  });

  // Auto-select first file when files load
  useEffect(() => {
    if (codeFiles.length > 0 && !selectedFile) {
      setSelectedFile(codeFiles[0]);
    }
  }, [codeFiles, selectedFile]);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast({
        title: "Prompt required",
        description: "Please describe what you'd like to build",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    
    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          prompt,
          projectId: null // Always create new project for simplicity
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate code');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let newProjectId: string | null = null;

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                
                if (data.type === 'project') {
                  newProjectId = data.projectId;
                  setCurrentProjectId(newProjectId);
                } else if (data.type === 'complete') {
                  // Invalidate queries to refresh data
                  queryClient.invalidateQueries({ 
                    queryKey: ['/api/conversations', data.projectId || currentProjectId] 
                  });
                  queryClient.invalidateQueries({ 
                    queryKey: ['/api/code-files', data.projectId || currentProjectId] 
                  });
                  
                  toast({
                    title: "Generated successfully!",
                    description: "Your code is ready",
                  });
                  setPrompt("");
                } else if (data.error) {
                  throw new Error(data.error);
                }
              } catch (e) {
                // Ignore JSON parse errors
              }
            }
          }
        }
      }
    } catch (error) {
      toast({
        title: "Generation failed",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCodeChange = async (newCode: string) => {
    if (!selectedFile) return;

    // Update the selected file immediately
    const updatedFile = { ...selectedFile, content: newCode };
    setSelectedFile(updatedFile);
    
    // Track this edit in the map for preview sync
    setEditedFiles(prev => new Map(prev).set(selectedFile.id, newCode));
    
    // TODO: Add debounced API call to save changes to backend
  };

  const handleCopyCode = () => {
    if (selectedFile) {
      navigator.clipboard.writeText(selectedFile.content);
      toast({
        title: "Copied to clipboard",
        description: "Code has been copied successfully",
      });
    }
  };

  const handleDownload = () => {
    toast({
      title: "Download started",
      description: "Preparing your project files...",
    });
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Top Navigation - Minimal */}
      <nav className="border-b border-border bg-background">
        <div className="flex h-12 items-center justify-between px-3">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => window.location.href = `/?project=${currentProjectId}`}
              data-testid="button-toggle-sidebar"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-xs"
            >
              Files
            </Button>
          </div>

          <div className="flex items-center gap-1">
            <ThemeToggle />
          </div>
        </div>
      </nav>

      <div className="flex flex-1 overflow-hidden">
        {/* Files Sidebar */}
        {sidebarOpen && (
          <div className="w-64 border-r border-border bg-card/30 backdrop-blur-sm">
            <div className="h-full flex flex-col p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-muted-foreground">Files</h3>
              </div>
              
              <ScrollArea className="flex-1">
                <div className="space-y-1">
                  {codeFiles.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      No files yet
                    </p>
                  ) : (
                    codeFiles.map((file) => (
                      <Button
                        key={file.id}
                        variant={selectedFile?.id === file.id ? "secondary" : "ghost"}
                        className="w-full justify-start font-mono text-xs"
                        onClick={() => setSelectedFile(file)}
                        data-testid={`file-${file.id}`}
                      >
                        <FileCode className="h-4 w-4 mr-2 flex-shrink-0" />
                        <span className="truncate">{file.filename}</span>
                      </Button>
                    ))
                  )}
                </div>
              </ScrollArea>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Editor and Preview Split */}
          <div className="flex-1 flex overflow-hidden">
            {/* Left Panel - Code Editor & Chat */}
            <div className="flex-1 flex flex-col border-r border-border">
              <Tabs defaultValue="code" className="flex-1 flex flex-col">
                <div className="border-b border-border bg-card/30 backdrop-blur-sm px-4">
                  <TabsList className="bg-transparent">
                    <TabsTrigger value="code" data-testid="tab-code">
                      <Code2 className="h-4 w-4 mr-2" />
                      Code
                    </TabsTrigger>
                    <TabsTrigger value="chat" data-testid="tab-chat">
                      <Sparkles className="h-4 w-4 mr-2" />
                      Chat
                    </TabsTrigger>
                  </TabsList>
                </div>

                <TabsContent value="code" className="flex-1 m-0 overflow-hidden">
                  {selectedFile ? (
                    <div className="h-full flex flex-col">
                      <div className="flex items-center justify-between px-4 py-2 bg-card/30 backdrop-blur-sm border-b border-border">
                        <div className="flex items-center gap-2">
                          <Code2 className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-mono" data-testid="text-filename">
                            {selectedFile.filename}
                          </span>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={handleCopyCode}
                          data-testid="button-copy-code"
                        >
                          <Copy className="h-4 w-4 mr-2" />
                          Copy
                        </Button>
                      </div>
                      <CodeEditor 
                        code={selectedFile.content} 
                        language={selectedFile.language}
                        onChange={handleCodeChange}
                      />
                    </div>
                  ) : (
                    <div className="h-full flex items-center justify-center text-muted-foreground">
                      <div className="text-center space-y-2">
                        <Code2 className="h-12 w-12 mx-auto opacity-50" />
                        <p>Select a file to view code</p>
                      </div>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="chat" className="flex-1 m-0 overflow-hidden">
                  <ConversationHistory conversations={conversations} />
                </TabsContent>
              </Tabs>
            </div>

            {/* Right Panel - Preview */}
            <div className="flex-1 flex flex-col bg-muted/30">
              <div className="flex items-center justify-between px-4 py-2 bg-card/30 backdrop-blur-sm border-b border-border">
                <div className="flex items-center gap-2">
                  <Play className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Live Preview</span>
                </div>
              </div>
              <LivePreview codeFiles={previewFiles} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
