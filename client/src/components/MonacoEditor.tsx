import { useEffect, useRef } from "react";
import Editor from "@monaco-editor/react";
import type { ProjectFile } from "@shared/schema";
import { useTheme } from "next-themes";

interface MonacoEditorProps {
  file: ProjectFile;
  onChange?: (value: string) => void;
  readOnly?: boolean;
}

export function MonacoEditor({ file, onChange, readOnly = false }: MonacoEditorProps) {
  const { theme } = useTheme();
  const editorRef = useRef<any>(null);

  const getLanguage = (fileLanguage: string, path: string): string => {
    // Map file language to Monaco language identifiers
    const languageMap: Record<string, string> = {
      'typescript': 'typescript',
      'javascript': 'javascript',
      'html': 'html',
      'css': 'css',
      'json': 'json',
      'markdown': 'markdown',
    };

    // Check file extension for more precise language detection
    if (path.endsWith('.tsx')) return 'typescript';
    if (path.endsWith('.jsx')) return 'javascript';
    if (path.endsWith('.ts')) return 'typescript';
    if (path.endsWith('.js')) return 'javascript';
    if (path.endsWith('.html')) return 'html';
    if (path.endsWith('.css')) return 'css';
    if (path.endsWith('.json')) return 'json';
    if (path.endsWith('.md')) return 'markdown';

    return languageMap[fileLanguage] || 'plaintext';
  };

  const handleEditorDidMount = (editor: any) => {
    editorRef.current = editor;
  };

  const handleChange = (value: string | undefined) => {
    if (onChange && value !== undefined) {
      onChange(value);
    }
  };

  // Determine if we should show minimap based on screen size
  const shouldShowMinimap = () => {
    return window.innerWidth >= 1280; // Show minimap on xl screens and above
  };

  return (
    <Editor
      height="100%"
      language={getLanguage(file.language, file.path)}
      value={file.content}
      onChange={handleChange}
      onMount={handleEditorDidMount}
      theme={theme === 'dark' ? 'vs-dark' : 'light'}
      options={{
        readOnly,
        minimap: {
          enabled: shouldShowMinimap(),
        },
        lineNumbers: 'on',
        tabSize: 2,
        insertSpaces: true,
        formatOnPaste: true,
        automaticLayout: true,
        scrollBeyondLastLine: false,
        fontSize: 14,
        fontFamily: 'JetBrains Mono, Menlo, Monaco, Courier New, monospace',
        wordWrap: 'on',
        smoothScrolling: true,
        cursorBlinking: 'smooth',
        cursorSmoothCaretAnimation: 'on',
        renderWhitespace: 'selection',
        bracketPairColorization: {
          enabled: true,
        },
      }}
      loading={
        <div className="h-full flex items-center justify-center">
          <div className="text-sm text-muted-foreground">Loading editor...</div>
        </div>
      }
    />
  );
}
