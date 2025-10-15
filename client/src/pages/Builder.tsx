import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation, useSearch } from "wouter";
import { Sparkles, Code2, Play, Download, Copy, Settings, ChevronLeft, ChevronRight } from "lucide-react";
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
import ProjectSidebar from "../components/ProjectSidebar";
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
          projectId: currentProjectId 
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
      {/* Top Navigation */}
      <nav className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              data-testid="button-toggle-sidebar"
            >
              {sidebarOpen ? <ChevronLeft className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
            </Button>
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <Sparkles className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="font-semibold">Lovable Builder</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" data-testid="button-settings">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
            <Button variant="outline" size="sm" onClick={handleDownload} data-testid="button-download">
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
            <Button size="sm" data-testid="button-deploy">
              <Play className="h-4 w-4 mr-2" />
              Deploy
            </Button>
          </div>
        </div>
      </nav>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        {sidebarOpen && (
          <div className="w-64 border-r border-border bg-card/30 backdrop-blur-sm">
            <ProjectSidebar
              currentProjectId={currentProjectId}
              onProjectSelect={setCurrentProjectId}
              codeFiles={codeFiles}
              onFileSelect={setSelectedFile}
              selectedFile={selectedFile}
            />
          </div>
        )}

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Prompt Input */}
          <div className="border-b border-border bg-card/30 backdrop-blur-sm p-4">
            <Card className="p-4 bg-background/50">
              <div className="flex gap-2">
                <Textarea
                  placeholder="Ask Lovable to create or modify your app..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="min-h-20 resize-none bg-background/50 border-border/50 focus-visible:ring-primary"
                  data-testid="input-builder-prompt"
                />
                <Button 
                  onClick={handleGenerate}
                  disabled={isGenerating || !prompt.trim()}
                  className="min-w-32"
                  data-testid="button-builder-generate"
                >
                  {isGenerating ? (
                    <>
                      <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Generate
                    </>
                  )}
                </Button>
              </div>
            </Card>
          </div>

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
