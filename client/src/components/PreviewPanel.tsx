import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Monitor, Smartphone, Tablet, RotateCw, ExternalLink, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface PreviewPanelProps {
  previewUrl?: string;
  isLoading?: boolean;
  error?: string;
}

type ViewportSize = 'desktop' | 'tablet' | 'mobile';

export function PreviewPanel({ previewUrl, isLoading, error }: PreviewPanelProps) {
  const [viewport, setViewport] = useState<ViewportSize>('desktop');
  const [key, setKey] = useState(0);
  
  const viewportSizes = {
    desktop: { width: '100%', height: '100%', icon: Monitor, label: 'Desktop' },
    tablet: { width: '768px', height: '100%', icon: Tablet, label: 'Tablet' },
    mobile: { width: '375px', height: '100%', icon: Smartphone, label: 'Mobile' }
  };
  
  const handleRefresh = () => {
    setKey(prev => prev + 1);
  };
  
  const handleOpenNew = () => {
    if (previewUrl) {
      window.open(previewUrl, '_blank');
    }
  };
  
  const currentViewport = viewportSizes[viewport];
  
  return (
    <div className="h-full flex flex-col bg-muted/30">
      {/* Preview Controls */}
      <div className="flex items-center justify-between gap-4 p-3 border-b border-border bg-card">
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="gap-1.5">
            <div className={`w-1.5 h-1.5 rounded-full ${isLoading ? 'bg-yellow-500 animate-pulse' : previewUrl ? 'bg-green-500' : 'bg-muted-foreground'}`} />
            {isLoading ? 'Building...' : previewUrl ? 'Live' : 'No Preview'}
          </Badge>
        </div>
        
        <div className="flex items-center gap-1">
          {/* Viewport Controls */}
          {Object.entries(viewportSizes).map(([key, { icon: Icon, label }]) => (
            <Button
              key={key}
              variant={viewport === key ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewport(key as ViewportSize)}
              className="gap-1.5 h-8"
              data-testid={`button-viewport-${key}`}
            >
              <Icon className="w-4 h-4" />
              <span className="hidden sm:inline text-xs">{label}</span>
            </Button>
          ))}
          
          <div className="w-px h-6 bg-border mx-1" />
          
          {/* Actions */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            disabled={!previewUrl || isLoading}
            className="h-8"
            data-testid="button-refresh"
          >
            <RotateCw className="w-4 h-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleOpenNew}
            disabled={!previewUrl || isLoading}
            className="h-8"
            data-testid="button-open-new"
          >
            <ExternalLink className="w-4 h-4" />
          </Button>
        </div>
      </div>
      
      {/* Preview Content */}
      <div className="flex-1 overflow-hidden flex items-center justify-center p-4">
        {error ? (
          <Card className="max-w-md p-6 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-destructive" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-sm text-foreground">Preview Error</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Failed to load preview
                </p>
              </div>
            </div>
            <div className="text-xs text-destructive bg-destructive/5 p-3 rounded-md font-mono">
              {error}
            </div>
          </Card>
        ) : isLoading ? (
          <div className="text-center space-y-3">
            <div className="w-12 h-12 mx-auto border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">Building Preview</p>
              <p className="text-xs text-muted-foreground">Setting up your application...</p>
            </div>
          </div>
        ) : !previewUrl ? (
          <div className="text-center space-y-3 max-w-md">
            <div className="w-16 h-16 mx-auto bg-muted rounded-full flex items-center justify-center">
              <Monitor className="w-8 h-8 text-muted-foreground" />
            </div>
            <div className="space-y-1">
              <h3 className="font-medium text-foreground">No Preview Available</h3>
              <p className="text-sm text-muted-foreground">
                Generate an application to see live preview
              </p>
            </div>
          </div>
        ) : (
          <div 
            className="bg-background border border-border rounded-md overflow-hidden shadow-lg transition-all duration-300"
            style={{
              width: currentViewport.width,
              height: currentViewport.height,
              maxWidth: '100%',
              maxHeight: '100%'
            }}
          >
            <iframe
              key={key}
              src={previewUrl}
              className="w-full h-full"
              title="Preview"
              sandbox="allow-scripts allow-same-origin allow-forms"
              data-testid="iframe-preview"
            />
          </div>
        )}
      </div>
    </div>
  );
}
