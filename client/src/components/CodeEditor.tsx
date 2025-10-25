import { useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileCode, AlertCircle } from "lucide-react";
import type { ProjectFile } from "@shared/schema";

interface CodeEditorProps {
  file?: ProjectFile;
}

export function CodeEditor({ file }: CodeEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    // Monaco editor would be initialized here
    // For now, we'll use a simple code display
  }, [file]);
  
  if (!file) {
    return (
      <div className="h-full flex items-center justify-center p-8">
        <div className="text-center space-y-3 max-w-md">
          <div className="w-16 h-16 mx-auto bg-muted rounded-full flex items-center justify-center">
            <FileCode className="w-8 h-8 text-muted-foreground" />
          </div>
          <div className="space-y-1">
            <h3 className="font-medium text-foreground">No File Selected</h3>
            <p className="text-sm text-muted-foreground">
              Select a file from the explorer to view its contents
            </p>
          </div>
        </div>
      </div>
    );
  }
  
  const getLanguageLabel = (lang: string) => {
    const labels: Record<string, string> = {
      'typescript': 'TypeScript',
      'javascript': 'JavaScript',
      'html': 'HTML',
      'css': 'CSS',
      'json': 'JSON',
      'markdown': 'Markdown'
    };
    return labels[lang] || lang.toUpperCase();
  };
  
  return (
    <div className="h-full flex flex-col">
      {/* File Header */}
      <div className="flex items-center justify-between gap-4 p-3 border-b border-border bg-card">
        <div className="flex items-center gap-3 min-w-0">
          <FileCode className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          <span className="text-sm font-medium truncate" data-testid="text-filename">
            {file.path}
          </span>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Badge variant="secondary" className="text-xs">
            {getLanguageLabel(file.language)}
          </Badge>
          <Badge variant="secondary" className="text-xs">
            {file.content.split('\n').length} lines
          </Badge>
        </div>
      </div>
      
      {/* Code Content */}
      <div className="flex-1 overflow-auto bg-background">
        <pre className="p-4 text-sm font-mono leading-relaxed">
          <code className="text-foreground" data-testid="code-content">
            {file.content}
          </code>
        </pre>
      </div>
      
      {/* Status Bar */}
      <div className="flex items-center justify-between px-3 py-1.5 border-t border-border bg-card text-xs text-muted-foreground">
        <div className="flex items-center gap-3">
          <span>{getLanguageLabel(file.language)}</span>
          <span>UTF-8</span>
        </div>
        <div className="flex items-center gap-3">
          <span>Ln 1, Col 1</span>
          <span>{file.content.length} chars</span>
        </div>
      </div>
    </div>
  );
}
