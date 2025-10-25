import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, Check, Loader2, X, FileCode, Package, Palette } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import type { GenerationProgress as ProgressType } from "@shared/schema";

interface GenerationProgressProps {
  progress: ProgressType;
  onCancel?: () => void;
}

const GENERATION_STEPS = [
  { id: 'analyzing', label: 'Analyzing prompt', icon: Sparkles },
  { id: 'planning', label: 'Planning structure', icon: Palette },
  { id: 'generating', label: 'Generating code', icon: FileCode },
  { id: 'dependencies', label: 'Setting up dependencies', icon: Package },
  { id: 'complete', label: 'Complete', icon: Check }
];

export function GenerationProgress({ progress, onCancel }: GenerationProgressProps) {
  const getCurrentStepIndex = () => {
    const step = progress.step.toLowerCase();
    const stepMap: Record<string, number> = {
      'analyzing': 0,
      'analyzing your prompt': 0,
      'planning': 1,
      'planning project structure': 1,
      'generating': 2,
      'generating code': 2,
      'dependencies': 3,
      'finalizing': 3,
      'finalizing project': 3,
      'complete': 4
    };
    
    for (const [key, value] of Object.entries(stepMap)) {
      if (step.includes(key)) {
        return value;
      }
    }
    
    return progress.progress < 30 ? 0 : progress.progress < 60 ? 2 : 3;
  };
  
  const currentStepIndex = getCurrentStepIndex();
  
  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full p-6 space-y-6 animate-in fade-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              {progress.complete ? (
                <Check className="w-5 h-5 text-primary" />
              ) : (
                <Loader2 className="w-5 h-5 text-primary animate-spin" />
              )}
            </div>
            <div>
              <h3 className="font-semibold text-foreground">
                {progress.complete ? 'Generation Complete!' : 'Generating Application'}
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {progress.complete ? 'Your app is ready' : 'AI is building your application...'}
              </p>
            </div>
          </div>
          
          {!progress.complete && onCancel && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onCancel}
              className="h-8 w-8 p-0"
              data-testid="button-cancel"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
        
        {/* Progress Bar */}
        <div className="space-y-2">
          <Progress value={progress.progress} className="h-2" />
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">{Math.round(progress.progress)}%</span>
            {progress.currentFile && (
              <span className="text-muted-foreground font-mono truncate max-w-[200px]">
                {progress.currentFile}
              </span>
            )}
          </div>
        </div>
        
        {/* Steps */}
        <div className="space-y-2">
          {GENERATION_STEPS.map((step, index) => {
            const Icon = step.icon;
            const isComplete = index < currentStepIndex;
            const isCurrent = index === currentStepIndex;
            const isPending = index > currentStepIndex;
            
            return (
              <div
                key={step.id}
                className={`
                  flex items-center gap-3 p-3 rounded-md transition-all
                  ${isCurrent ? 'bg-primary/10' : 'bg-transparent'}
                `}
                data-testid={`step-${step.id}`}
              >
                <div className={`
                  w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0
                  ${isComplete ? 'bg-primary text-primary-foreground' : 
                    isCurrent ? 'bg-primary/20 text-primary' : 
                    'bg-muted text-muted-foreground'}
                `}>
                  {isComplete ? (
                    <Check className="w-4 h-4" />
                  ) : isCurrent ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Icon className="w-4 h-4" />
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${
                    isComplete || isCurrent ? 'text-foreground' : 'text-muted-foreground'
                  }`}>
                    {step.label}
                  </p>
                  {isCurrent && progress.currentFile && (
                    <p className="text-xs text-muted-foreground truncate mt-0.5 font-mono">
                      {progress.currentFile}
                    </p>
                  )}
                </div>
                
                {isComplete && (
                  <Check className="w-4 h-4 text-primary flex-shrink-0" />
                )}
              </div>
            );
          })}
        </div>
        
        {progress.complete && (
          <Button 
            className="w-full"
            onClick={onCancel}
            data-testid="button-close"
          >
            Close
          </Button>
        )}
      </Card>
    </div>
  );
}
