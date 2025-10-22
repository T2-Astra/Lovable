import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Sparkles, Code2, Download, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import ConversationHistory from "@/components/ConversationHistory";
import LivePreview from "@/components/LivePreview";
import { ThemeToggle } from "@/components/ThemeToggle";
import Aurora from "@/components/Aurora";
import type { Conversation, CodeFile } from "@shared/schema";

export default function Home() {
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [showBuilder, setShowBuilder] = useState(false);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);

  // Check URL for project parameter to show conversation interface
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const projectId = urlParams.get('project');
    if (projectId) {
      setCurrentProjectId(projectId);
      setShowBuilder(true);
    }
  }, []);
  const [localConversations, setLocalConversations] = useState<Conversation[]>([]);

  const { data: conversations = [] } = useQuery<Conversation[]>({
    queryKey: currentProjectId ? ['/api/conversations', currentProjectId] : [],
    enabled: !!currentProjectId,
  });

  const { data: codeFiles = [] } = useQuery<CodeFile[]>({
    queryKey: currentProjectId ? ['/api/code-files', currentProjectId] : [],
    enabled: !!currentProjectId,
  });

  // Merge server conversations with local/optimistic updates
  const displayConversations = currentProjectId 
    ? [...conversations, ...localConversations]
    : localConversations;

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
    setShowBuilder(true);
    
    // Add user message optimistically
    const userMessage: Conversation = {
      id: `temp-user-${Date.now()}`,
      projectId: currentProjectId || 'temp',
      role: 'user',
      content: prompt,
      timestamp: new Date(),
    };
    setLocalConversations(prev => [...prev, userMessage]);
    
    // Add placeholder for assistant message
    const assistantMessageId = `temp-assistant-${Date.now()}`;
    const assistantMessage: Conversation = {
      id: assistantMessageId,
      projectId: currentProjectId || 'temp',
      role: 'assistant',
      content: '',
      timestamp: new Date(),
    };
    setLocalConversations(prev => [...prev, assistantMessage]);
    
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
      let projectId: string | null = currentProjectId;
      let accumulatedContent = '';

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
                  projectId = data.projectId;
                  setCurrentProjectId(projectId);
                } else if (data.type === 'chunk' && data.content) {
                  // Stream content in real-time
                  accumulatedContent += data.content;
                  
                  // Show user-friendly generating message instead of raw JSON
                  const displayMessage = accumulatedContent.includes('"files"') 
                    ? '✨ Generating your code...' 
                    : accumulatedContent;
                  
                  // Update the assistant message with streaming content
                  setLocalConversations(prev => 
                    prev.map(msg => 
                      msg.id === assistantMessageId 
                        ? { ...msg, content: displayMessage }
                        : msg
                    )
                  );
                } else if (data.type === 'complete') {
                  // Clear local conversations and refetch from server
                  setLocalConversations([]);
                  
                  // Invalidate queries to refresh data
                  queryClient.invalidateQueries({ 
                    queryKey: ['/api/conversations', data.projectId || projectId] 
                  });
                  queryClient.invalidateQueries({ 
                    queryKey: ['/api/code-files', data.projectId || projectId] 
                  });
                  
                  toast({
                    title: "Generated successfully!",
                    description: "Your code is ready",
                  });
                  setPrompt("");
                } else if (data.error) {
                  console.error('Generation error:', data.error);
                  toast({
                    title: "Error",
                    description: data.error,
                    variant: "destructive",
                  });
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
      setShowBuilder(false);
      setLocalConversations([]);
    } finally {
      setIsGenerating(false);
    }
  };

  // Show builder interface if we have a project
  if (showBuilder || currentProjectId) {
    return (
      <div className="h-screen flex bg-background">
        {/* Main Builder Interface */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Panel - Conversation History */}
          <div className="w-80 border-r border-border bg-card/30 backdrop-blur-sm flex flex-col">
            <div className="flex-1 overflow-hidden">
              <ConversationHistory conversations={displayConversations} />
            </div>
            
            {/* Input inside conversation panel */}
            <div className="border-t border-border bg-card/50 backdrop-blur-sm p-2">
              <div className="relative flex items-end gap-2 rounded-md border border-border/50 bg-background/50 p-2 focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2">
                <Textarea
                  placeholder="Continue the conversation or ask for modifications..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleGenerate();
                    }
                  }}
                  className="flex-1 min-h-[60px] resize-none bg-transparent border-0 focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 p-0"
                  disabled={isGenerating}
                  data-testid="input-continue-prompt"
                />
                <Button 
                  onClick={handleGenerate}
                  disabled={isGenerating || !prompt.trim()}
                  size="icon"
                  className="flex-shrink-0"
                  data-testid="button-send"
                >
                  {isGenerating ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* Right Panel - Live Preview */}
          <div className="flex-1 flex flex-col">
            <div className="border-b border-border bg-card/30 backdrop-blur-sm p-2 flex justify-between items-center">
              <h2 className="font-semibold text-sm text-muted-foreground">Preview</h2>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowBuilder(false);
                    setCurrentProjectId(null);
                    setPrompt("");
                  }}
                  className="text-xs"
                  data-testid="button-back-home"
                >
                  Chat
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setLocation(`/builder?project=${currentProjectId}`)}
                  className="text-xs"
                  data-testid="button-open-builder"
                >
                  <Code2 className="h-3 w-3 mr-1" />
                  Edit
                </Button>
                <ThemeToggle />
              </div>
            </div>
            <div className="flex-1 overflow-hidden">
              <LivePreview codeFiles={codeFiles} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Landing Page
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section with Gradient */}
      <div className="relative min-h-screen overflow-hidden">
        {/* Aurora Background */}
        <div className="absolute inset-0">
          <Aurora
            colorStops={["#3A29FF", "#FF94B4", "#FF3232"]}
            blend={0.5}
            amplitude={1.0}
            speed={0.5}
          />
        </div>
        
        {/* Grain Texture Overlay */}
        <div 
          className="absolute inset-0" 
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.4'/%3E%3C/svg%3E")`,
            backgroundSize: '100px 100px',
            backgroundRepeat: 'repeat',
            backgroundBlendMode: 'overlay',
            backgroundPosition: 'left top',
            mixBlendMode: 'overlay',
            opacity: 0.3
          }}
        />
        
        {/* Top Navigation */}
        <nav className="relative z-10 border-b border-border/40 bg-background/80 backdrop-blur-lg">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex h-12 items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary">
                  <Sparkles className="h-4 w-4 text-primary-foreground" />
                </div>
                <span className="text-lg font-bold">Astra</span>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" data-testid="button-community">
                  Community
                </Button>
                <Button variant="ghost" size="sm" data-testid="button-pricing">
                  Pricing
                </Button>
                <Button variant="ghost" size="sm" data-testid="button-docs">
                  Learn
                </Button>
                <ThemeToggle />
                <Button variant="default" size="sm" data-testid="button-get-started">
                  Get Started
                </Button>
              </div>
            </div>
          </div>
        </nav>

        <section className="mb-[20px] flex w-full flex-col items-center justify-center py-[20vh] md:mb-0 2xl:py-64">
          <div className="relative mb-4 flex flex-col items-center px-4 text-center md:mb-6">
            <div className="flex w-full flex-col items-center justify-center gap-2"></div>
            <h1 className="mb-2 flex items-center gap-1 text-3xl font-medium leading-none text-foreground sm:text-3xl md:mb-2.5 md:gap-0 md:text-5xl">
              <span className="pt-0.5 tracking-tight md:pt-0">Build something With-</span>
              <span className="bg-gradient-to-r from-purple-600 via-pink-500 to-blue-500 bg-clip-text text-transparent font-bold tracking-tight">Astra</span>
            </h1>
            <p className="mb-6 max-w-[25ch] text-center text-lg leading-t ight text-foreground/65 md:max-w-full md:text-xl">Create apps and websites by chatting with AI</p>
          </div>
          <div className="w-full max-w-xl">
            <div className="relative w-full">
              <div className="flex w-full flex-col items-center">
                <div className="relative size-full">
                  <form id="chat-input" className="group flex flex-col gap-1.5 p-2.5 w-full rounded-3.5xl border border-muted-border bg-muted text-base shadow-xl transition-all duration-150 ease-in-out focus-within:border-foreground/20 hover:border-foreground/10 focus-within:hover:border-foreground/20">
                    <div className="relative flex flex-1 items-center">
                      <textarea
                        className="flex w-full rounded-md px-2 py-2 ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 resize-none text-[16px] leading-snug placeholder-shown:text-ellipsis placeholder-shown:whitespace-nowrap md:text-base focus-visible:ring-0 focus-visible:ring-offset-0 max-h-[max(35svh,5rem)] bg-transparent focus:bg-transparent flex-1"
                        id="chatinput"
                        autoFocus
                        style={{minHeight: '65px', height: '65px'}}
                        placeholder="Ask Astra to create a web app th"
                        maxLength={50000}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleGenerate();
                    }
                  }}
                      />
                    </div>
                    <div className="flex gap-1 flex-wrap items-center">
                      <button className="inline-flex items-center justify-center whitespace-nowrap text-sm font-medium transition-colors duration-100 ease-in-out focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none border border-input bg-muted hover:bg-accent hover:border-accent gap-1.5 h-10 w-10 rounded-full p-0 text-muted-foreground hover:text-foreground md:h-8 md:w-8" type="button">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" width="100%" height="100%" className="shrink-0 h-5 w-5 text-muted-foreground">
                          <path fill="currentColor" d="M11.25 18v-5.25H6a.75.75 0 0 1 0-1.5h5.25V6a.75.75 0 0 1 1.5 0v5.25H18a.75.75 0 0 1 0 1.5h-5.25V18a.75.75 0 0 1-1.5 0"></path>
                        </svg>
                      </button>
                      <div>
                        <button className="inline-flex items-center justify-center whitespace-nowrap text-sm font-medium transition-colors duration-100 ease-in-out focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none border border-input bg-muted hover:bg-accent hover:border-accent py-2 h-10 w-10 gap-1.5 rounded-full px-3 text-muted-foreground hover:text-foreground md:h-8 md:w-fit" type="button">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" width="100%" height="100%" className="shrink-0 h-4 w-4">
                            <path fill="currentColor" d="M5.25 15V8a.75.75 0 0 1 1.5 0v7a5.25 5.25 0 1 0 10.5 0V7a3.25 3.25 0 0 0-6.5 0v8a1.25 1.25 0 1 0 2.5 0V8a.75.75 0 0 1 1.5 0v7a2.75 2.75 0 1 1-5.5 0V7a4.75 4.75 0 1 1 9.5 0v8a6.75 6.75 0 0 1-13.5 0"></path>
                          </svg>
                          <span className="hidden md:flex">Attach</span>
                        </button>
                      </div>
                      <input id="file-upload" className="hidden" multiple type="file" style={{border:0,clip:'rect(0, 0, 0, 0)',clipPath:'inset(50%)',height:'1px',margin:'0 -1px -1px 0',overflow:'hidden',padding:0,position:'absolute',width:'1px',whiteSpace:'nowrap'}} tabIndex={-1} />
                      <div className="ml-auto flex items-center gap-1">
                        <div className="relative flex items-center gap-1 md:gap-2">
                          <div className=""></div>
                          <button className="gap-2 whitespace-nowrap text-sm font-medium ease-in-out focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none [&_svg]:pointer-events-none border border-input bg-muted hover:bg-accent hover:border-accent relative z-10 flex rounded-full p-0 text-muted-foreground transition-opacity duration-150 disabled:cursor-not-allowed disabled:opacity-50 items-center justify-center h-10 w-10 md:h-8 md:w-8" type="button">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" width="100%" height="100%" className="shrink-0 relative z-10 h-5 w-5">
                              <path fill="currentColor" d="M11.25 20V4a.75.75 0 0 1 1.5 0v16a.75.75 0 0 1-1.5 0m8-2V6a.75.75 0 0 1 1.5 0v12a.75.75 0 0 1-1.5 0m-12-1V7a.75.75 0 0 1 1.5 0v10a.75.75 0 0 1-1.5 0m8-2V9a.75.75 0 0 1 1.5 0v6a.75.75 0 0 1-1.5 0m-12-1v-4a.75.75 0 0 1 1.5 0v4a.75.75 0 0 1-1.5 0"></path>
                            </svg>
                          </button>
                          <button 
                            id="chatinput-send-message-button" 
                            type="submit" 
                            className="flex h-10 w-10 items-center justify-center rounded-full bg-foreground transition-opacity duration-150 ease-out disabled:cursor-not-allowed disabled:opacity-50 md:h-8 md:w-8" 
                            disabled={isGenerating || !prompt.trim()}
                    onClick={handleGenerate}
                  >
                    {isGenerating ? (
                              <div className="h-6 w-6 animate-spin rounded-full border-2 border-background border-t-transparent" />
                            ) : (
                              <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" width="100%" height="100%" className="shrink-0 h-6 w-6 text-background">
                                <path fill="currentColor" d="M11 19V7.415l-3.293 3.293a1 1 0 1 1-1.414-1.414l5-5 .074-.067a1 1 0 0 1 1.34.067l5 5a1 1 0 1 1-1.414 1.414L13 7.415V19a1 1 0 1 1-2 0"></path>
                              </svg>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
