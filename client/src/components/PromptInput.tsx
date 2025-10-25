import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Sparkles, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface PromptInputProps {
  onGenerate: (prompt: string, template?: string) => void;
  isGenerating?: boolean;
}

const EXAMPLE_PROMPTS = [
  {
    title: "Todo App",
    prompt: "Create a todo list app with add, delete, and mark complete functionality. Use a clean, modern design with smooth animations.",
    icon: "✓"
  },
  {
    title: "Portfolio Site",
    prompt: "Build a personal portfolio website with hero section, projects gallery, about me section, and contact form. Make it responsive and visually stunning.",
    icon: "🎨"
  },
  {
    title: "Weather Dashboard",
    prompt: "Create a weather dashboard that displays current weather and 5-day forecast. Include temperature, conditions, and weather icons. Use a card-based layout.",
    icon: "🌤️"
  },
  {
    title: "E-commerce Product Page",
    prompt: "Build a product detail page for an e-commerce site with image gallery, product info, add to cart button, and reviews section.",
    icon: "🛍️"
  }
];

export function PromptInput({ onGenerate, isGenerating }: PromptInputProps) {
  const [prompt, setPrompt] = useState("");
  const maxChars = 2000;

  const handleSubmit = () => {
    if (prompt.trim() && prompt.length >= 10) {
      onGenerate(prompt);
    }
  };

  const handleExampleClick = (examplePrompt: string) => {
    setPrompt(examplePrompt);
  };

  const isValid = prompt.trim().length >= 10 && prompt.length <= maxChars;

  return (
    <div className="flex items-center justify-center h-full w-full p-8 overflow-y-auto">
      <div className="w-full max-w-3xl space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-medium">
            <Sparkles className="w-3 h-3" />
            AI-Powered Code Generation
          </div>
          <h1 className="text-2xl font-semibold text-foreground">
            What would you like to build?
          </h1>
          <p className="text-sm text-muted-foreground">
            Describe your web application and let AI bring it to life
          </p>
        </div>

        {/* Prompt Input */}
        <Card className="p-6 space-y-4">
          <div className="space-y-2">
            <Textarea
              placeholder="Describe the website you want to build... Be specific about features, design style, and functionality."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="min-h-32 resize-none text-sm"
              disabled={isGenerating}
              data-testid="textarea-prompt"
            />
            <div className="flex items-center justify-between text-xs">
              <span className={`${prompt.length < 10 ? 'text-muted-foreground' : prompt.length > maxChars ? 'text-destructive' : 'text-muted-foreground'}`}>
                {prompt.length < 10 ? `Minimum 10 characters (${10 - prompt.length} more needed)` : `${prompt.length}/${maxChars}`}
              </span>
              {prompt.length > 0 && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setPrompt("")}
                  className="h-6 px-2"
                  data-testid="button-clear"
                >
                  Clear
                </Button>
              )}
            </div>
          </div>

          <Button
            onClick={handleSubmit}
            disabled={!isValid || isGenerating}
            className="w-full gap-2"
            size="lg"
            data-testid="button-generate"
          >
            {isGenerating ? (
              <>
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4" />
                Generate Application
              </>
            )}
          </Button>
        </Card>

        {/* Example Prompts */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs text-muted-foreground">Try these examples</span>
            <div className="h-px flex-1 bg-border" />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {EXAMPLE_PROMPTS.map((example, idx) => (
              <Card
                key={idx}
                className="p-4 cursor-pointer hover-elevate active-elevate-2 transition-all"
                onClick={() => handleExampleClick(example.prompt)}
                data-testid={`card-example-${idx}`}
              >
                <div className="flex items-start gap-3">
                  <div className="text-2xl">{example.icon}</div>
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="font-medium text-sm text-foreground">
                      {example.title}
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {example.prompt}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Features */}
        <div className="flex flex-wrap items-center justify-center gap-2">
          <Badge variant="secondary" className="gap-1">
            <span className="w-1.5 h-1.5 bg-primary rounded-full" />
            React + Vite
          </Badge>
          <Badge variant="secondary" className="gap-1">
            <span className="w-1.5 h-1.5 bg-primary rounded-full" />
            Next.js
          </Badge>
          <Badge variant="secondary" className="gap-1">
            <span className="w-1.5 h-1.5 bg-primary rounded-full" />
            Vanilla JavaScript
          </Badge>
          <Badge variant="secondary" className="gap-1">
            <span className="w-1.5 h-1.5 bg-primary rounded-full" />
            Live Preview
          </Badge>
        </div>
      </div>
    </div>
  );
}
