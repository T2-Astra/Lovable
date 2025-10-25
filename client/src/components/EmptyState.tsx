import { Sparkles, Code2, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  onGetStarted?: () => void;
}

export function EmptyState({ onGetStarted }: EmptyStateProps) {
  return (
    <div className="flex items-center justify-center h-full w-full p-8">
      <div className="max-w-md text-center space-y-6">
        {/* Illustration */}
        <div className="relative mx-auto w-48 h-48">
          <div className="absolute inset-0 bg-primary/10 rounded-full blur-3xl" />
          <div className="relative flex items-center justify-center h-full">
            <div className="grid grid-cols-2 gap-3">
              <div className="w-20 h-20 bg-card border border-card-border rounded-md flex items-center justify-center">
                <Code2 className="w-10 h-10 text-muted-foreground" />
              </div>
              <div className="w-20 h-20 bg-card border border-card-border rounded-md flex items-center justify-center">
                <Zap className="w-10 h-10 text-primary" />
              </div>
              <div className="w-20 h-20 bg-primary/10 border border-primary/20 rounded-md flex items-center justify-center col-span-2">
                <Sparkles className="w-10 h-10 text-primary" />
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-3">
          <h2 className="text-2xl font-semibold text-foreground">
            Build Anything with AI
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Describe your web application in plain English and watch as AI generates a complete, working project with live preview. From simple landing pages to complex applications.
          </p>
        </div>

        {/* CTA */}
        {onGetStarted && (
          <Button 
            size="lg" 
            onClick={onGetStarted}
            className="gap-2"
            data-testid="button-get-started"
          >
            <Sparkles className="w-4 h-4" />
            Get Started
          </Button>
        )}

        {/* Features */}
        <div className="grid grid-cols-3 gap-4 pt-4 text-xs text-muted-foreground">
          <div className="space-y-1">
            <Code2 className="w-5 h-5 mx-auto text-primary" />
            <div>Multiple Frameworks</div>
          </div>
          <div className="space-y-1">
            <Zap className="w-5 h-5 mx-auto text-primary" />
            <div>Live Preview</div>
          </div>
          <div className="space-y-1">
            <Sparkles className="w-5 h-5 mx-auto text-primary" />
            <div>AI Powered</div>
          </div>
        </div>
      </div>
    </div>
  );
}
