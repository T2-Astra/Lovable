import { useState } from "react";
import { useLocation } from "wouter";
import { Sparkles, Code2, Zap, Download, Copy, FileCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

export default function Home() {
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

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
        body: JSON.stringify({ prompt }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate code');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let projectId: string | null = null;

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
                } else if (data.type === 'complete' && data.projectId) {
                  projectId = data.projectId;
                  toast({
                    title: "Success!",
                    description: "Your app has been generated",
                  });
                  setLocation(`/builder?project=${projectId}`);
                  return;
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

      if (projectId) {
        setLocation(`/builder?project=${projectId}`);
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

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section with Gradient */}
      <div className="relative min-h-screen overflow-hidden">
        {/* Animated Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-blue-900/20 to-pink-900/20" />
        <div className="absolute inset-0 bg-gradient-to-tr from-blue-600/10 via-purple-600/10 to-pink-600/10 animate-pulse" style={{ animationDuration: "4s" }} />
        
        {/* Top Navigation */}
        <nav className="relative z-10 border-b border-border/40 bg-background/80 backdrop-blur-lg">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex h-16 items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                  <Sparkles className="h-5 w-5 text-primary-foreground" />
                </div>
                <span className="text-xl font-bold">Lovable</span>
              </div>
              <div className="flex items-center gap-4">
                <Button variant="ghost" data-testid="button-community">
                  Community
                </Button>
                <Button variant="ghost" data-testid="button-pricing">
                  Pricing
                </Button>
                <Button variant="ghost" data-testid="button-docs">
                  Learn
                </Button>
                <Button variant="default" data-testid="button-get-started">
                  Get Started
                </Button>
              </div>
            </div>
          </div>
        </nav>

        {/* Hero Content */}
        <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-32">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <h1 className="text-6xl md:text-7xl font-bold leading-tight">
              Build something{" "}
              <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
                Lovable
              </span>
            </h1>
            
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Create apps and websites by chatting with AI
            </p>

            {/* Prompt Input Card */}
            <Card className="max-w-3xl mx-auto p-6 bg-card/80 backdrop-blur-sm border-border/50 shadow-2xl">
              <div className="space-y-4">
                <Textarea
                  placeholder="Ask Lovable to create a landing page for my..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="min-h-24 resize-none text-base bg-background/50 border-border/50 focus-visible:ring-primary"
                  data-testid="input-prompt"
                />
                
                <div className="flex items-center justify-between">
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" data-testid="button-attach">
                      <FileCode className="h-4 w-4 mr-2" />
                      Attach
                    </Button>
                    <Button variant="ghost" size="sm" data-testid="button-public">
                      <Code2 className="h-4 w-4 mr-2" />
                      Public
                    </Button>
                  </div>
                  
                  <Button 
                    onClick={handleGenerate}
                    disabled={isGenerating || !prompt.trim()}
                    className="min-w-32"
                    data-testid="button-generate"
                  >
                    {isGenerating ? (
                      <>
                        <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Zap className="h-4 w-4 mr-2" />
                        Generate
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </Card>

            {/* Example Prompts */}
            <div className="flex flex-wrap gap-2 justify-center">
              <Button 
                variant="secondary" 
                size="sm"
                onClick={() => setPrompt("Create a modern portfolio website with smooth animations")}
                data-testid="button-example-1"
              >
                Portfolio website
              </Button>
              <Button 
                variant="secondary" 
                size="sm"
                onClick={() => setPrompt("Build a task management app with drag and drop")}
                data-testid="button-example-2"
              >
                Task manager
              </Button>
              <Button 
                variant="secondary" 
                size="sm"
                onClick={() => setPrompt("Create a landing page for a SaaS product")}
                data-testid="button-example-3"
              >
                SaaS landing page
              </Button>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <Card className="p-6 bg-card/50 backdrop-blur-sm border-border/50 hover-elevate">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 mb-4">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">AI-Powered Generation</h3>
              <p className="text-muted-foreground">
                Describe your app in plain English and watch AI generate production-ready code instantly
              </p>
            </Card>

            <Card className="p-6 bg-card/50 backdrop-blur-sm border-border/50 hover-elevate">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 mb-4">
                <Code2 className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Live Preview</h3>
              <p className="text-muted-foreground">
                See your app come to life in real-time with instant preview and interactive editing
              </p>
            </Card>

            <Card className="p-6 bg-card/50 backdrop-blur-sm border-border/50 hover-elevate">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 mb-4">
                <Download className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Export & Deploy</h3>
              <p className="text-muted-foreground">
                Download your code or deploy with one click. Full ownership, no vendor lock-in
              </p>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
