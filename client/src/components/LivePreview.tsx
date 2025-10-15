import { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { AlertCircle, Play } from "lucide-react";
import type { CodeFile } from "@shared/schema";

interface LivePreviewProps {
  codeFiles: CodeFile[];
}

export default function LivePreview({ codeFiles }: LivePreviewProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (codeFiles.length === 0) return;

    try {
      const htmlFile = codeFiles.find(f => f.filename.endsWith('.html'));
      const cssFile = codeFiles.find(f => f.filename.endsWith('.css'));
      const jsFile = codeFiles.find(f => f.filename.endsWith('.js') || f.filename.endsWith('.jsx'));

      let previewContent = '';

      if (htmlFile) {
        previewContent = htmlFile.content;
        
        if (cssFile) {
          previewContent = previewContent.replace(
            '</head>',
            `<style>${cssFile.content}</style></head>`
          );
        }
        
        if (jsFile) {
          previewContent = previewContent.replace(
            '</body>',
            `<script>${jsFile.content}</script></body>`
          );
        }
      } else {
        previewContent = `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <style>
                ${cssFile?.content || 'body { font-family: system-ui, sans-serif; padding: 20px; }'}
              </style>
            </head>
            <body>
              <div id="root"></div>
              <script>
                ${jsFile?.content || ''}
              </script>
            </body>
          </html>
        `;
      }

      if (iframeRef.current) {
        const iframe = iframeRef.current;
        const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
        if (iframeDoc) {
          iframeDoc.open();
          iframeDoc.write(previewContent);
          iframeDoc.close();
          setError(null);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to render preview');
    }
  }, [codeFiles]);

  if (codeFiles.length === 0) {
    return (
      <div className="h-full flex items-center justify-center bg-muted/50" data-testid="preview-empty">
        <div className="text-center space-y-2 text-muted-foreground">
          <div className="w-16 h-16 mx-auto rounded-lg bg-muted/10 border border-border flex items-center justify-center">
            <Play className="h-8 w-8 opacity-50" />
          </div>
          <p className="font-medium">No preview yet</p>
          <p className="text-sm">Generate code to see live preview</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center bg-muted/50 p-8" data-testid="preview-error">
        <Card className="p-6 max-w-md bg-destructive/10 border-destructive/20">
          <div className="flex gap-3">
            <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-medium text-destructive">Preview Error</p>
              <p className="text-sm text-muted-foreground">{error}</p>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-full bg-white" data-testid="preview-iframe-container">
      <iframe
        ref={iframeRef}
        className="w-full h-full border-0"
        sandbox="allow-scripts allow-same-origin"
        title="Live Preview"
        data-testid="preview-iframe"
      />
    </div>
  );
}
