import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Monitor, Smartphone, Tablet, RotateCw, ExternalLink, AlertCircle, Terminal, ChevronDown, ChevronUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { WebContainerManager, TerminalOutput, WebContainerStatus } from "@/lib/webcontainer";

interface PreviewPanelProps {
  previewUrl?: string;
  isLoading?: boolean;
  error?: string;
  webContainer?: WebContainerManager;
  useWebContainer?: boolean;
}

type ViewportSize = 'desktop' | 'tablet' | 'mobile';

export function PreviewPanel({ previewUrl, isLoading, error, webContainer, useWebContainer }: PreviewPanelProps) {
  const [viewport, setViewport] = useState<ViewportSize>('desktop');
  const [key, setKey] = useState(0);
  const [consoleOpen, setConsoleOpen] = useState(false);
  const [terminalLogs, setTerminalLogs] = useState<TerminalOutput[]>([]);
  const [containerStatus, setContainerStatus] = useState<WebContainerStatus | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const viewportSizes = {
    desktop: { width: '100%', height: '100%', icon: Monitor, label: 'Desktop' },
    tablet: { width: '768px', height: '100%', icon: Tablet, label: 'Tablet' },
    mobile: { width: '375px', height: '100%', icon: Smartphone, label: 'Mobile' }
  };
  
  // Subscribe to WebContainer terminal output and status
  useEffect(() => {
    if (!webContainer || !useWebContainer) {
      return;
    }

    const unsubscribeTerminal = webContainer.onTerminalOutput((output) => {
      setTerminalLogs(prev => [...prev, output]);
    });

    const unsubscribeStatus = webContainer.onStatusChange((status) => {
      setContainerStatus(status);
    });

    return () => {
      unsubscribeTerminal();
      unsubscribeStatus();
    };
  }, [webContainer, useWebContainer]);

  // Auto-scroll terminal to bottom when new logs arrive
  useEffect(() => {
    if (scrollRef.current && consoleOpen) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [terminalLogs, consoleOpen]);

  // Auto-open console when there are errors
  useEffect(() => {
    if (containerStatus?.error) {
      setConsoleOpen(true);
    }
  }, [containerStatus?.error]);
  
  const handleRefresh = () => {
    setKey(prev => prev + 1);
  };
  
  const handleOpenNew = () => {
    const url = useWebContainer ? containerStatus?.serverUrl : previewUrl;
    if (url) {
      window.open(url, '_blank');
    }
  };

  const handleClearLogs = () => {
    setTerminalLogs([]);
  };
  
  const currentViewport = viewportSizes[viewport];

  // Determine the actual preview URL to use
  const actualPreviewUrl = useWebContainer ? containerStatus?.serverUrl : previewUrl;
  const actualIsLoading = useWebContainer 
    ? (containerStatus?.isBooting || containerStatus?.isInstalling || containerStatus?.isStarting || isLoading)
    : isLoading;
  const actualError = useWebContainer ? containerStatus?.error : error;
  
  // Get status message for WebContainer
  const getStatusMessage = (): string => {
    if (!containerStatus) return 'Initializing...';
    if (containerStatus.isBooting) return 'Booting container...';
    if (containerStatus.isInstalling) return 'Installing dependencies...';
    if (containerStatus.isStarting) return 'Starting dev server...';
    if (containerStatus.isReady) return 'Server running';
    return 'Ready';
  };
  
  return (
    <div className="h-full flex flex-col bg-muted/30">
      {/* Preview Controls */}
      <div className="flex items-center justify-between gap-4 p-3 border-b border-border bg-card">
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="gap-1.5">
            <div className={`w-1.5 h-1.5 rounded-full ${
              actualIsLoading 
                ? 'bg-yellow-500 animate-pulse' 
                : actualPreviewUrl 
                  ? 'bg-green-500' 
                  : 'bg-muted-foreground'
            }`} />
            {actualIsLoading 
              ? (useWebContainer ? getStatusMessage() : 'Building...') 
              : actualPreviewUrl 
                ? 'Live' 
                : 'No Preview'}
          </Badge>
          {useWebContainer && (
            <Badge variant="outline" className="gap-1.5 text-xs">
              <Terminal className="w-3 h-3" />
              WebContainer
            </Badge>
          )}
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
            disabled={!actualPreviewUrl || actualIsLoading}
            className="h-8"
            data-testid="button-refresh"
          >
            <RotateCw className="w-4 h-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleOpenNew}
            disabled={!actualPreviewUrl || actualIsLoading}
            className="h-8"
            data-testid="button-open-new"
          >
            <ExternalLink className="w-4 h-4" />
          </Button>

          {useWebContainer && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setConsoleOpen(!consoleOpen)}
              className="h-8 gap-1.5"
              data-testid="button-toggle-console"
            >
              <Terminal className="w-4 h-4" />
              {consoleOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
            </Button>
          )}
        </div>
      </div>
      
      {/* Preview Content */}
      <div className="flex-1 overflow-hidden flex flex-col">
        <div className={`${consoleOpen && useWebContainer ? 'flex-1' : 'h-full'} overflow-hidden flex items-center justify-center p-4`}>
          {actualError ? (
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
                {actualError}
              </div>
            </Card>
          ) : actualIsLoading ? (
            <div className="text-center space-y-3">
              <div className="w-12 h-12 mx-auto border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-foreground">
                  {useWebContainer ? getStatusMessage() : 'Building Preview'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {useWebContainer 
                    ? 'Setting up your development environment...' 
                    : 'Setting up your application...'}
                </p>
              </div>
            </div>
          ) : !actualPreviewUrl ? (
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
                src={actualPreviewUrl}
                className="w-full h-full"
                title="Preview"
                sandbox="allow-scripts allow-same-origin allow-forms allow-modals allow-popups"
                data-testid="iframe-preview"
              />
            </div>
          )}
        </div>

        {/* Console Output Panel */}
        {useWebContainer && consoleOpen && (
          <div className="h-64 border-t border-border bg-card flex flex-col">
            <div className="flex items-center justify-between px-4 py-2 border-b border-border">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">Console</span>
                <Badge variant="secondary" className="text-xs">
                  {terminalLogs.length} lines
                </Badge>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearLogs}
                className="h-7 text-xs"
                data-testid="button-clear-logs"
              >
                Clear
              </Button>
            </div>
            <ScrollArea className="flex-1">
              <div ref={scrollRef} className="p-3 font-mono text-xs space-y-1">
                {terminalLogs.length === 0 ? (
                  <p className="text-muted-foreground">No output yet...</p>
                ) : (
                  terminalLogs.map((log, index) => (
                    <div
                      key={index}
                      className={`${
                        log.type === 'stderr' 
                          ? 'text-destructive' 
                          : 'text-foreground'
                      }`}
                      data-testid={`log-${index}`}
                    >
                      {log.data}
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>
        )}
      </div>
    </div>
  );
}
