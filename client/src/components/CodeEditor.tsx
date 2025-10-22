import { Editor } from "@monaco-editor/react";
import { Card } from "@/components/ui/card";

interface CodeEditorProps {
  code: string;
  language: string;
  onChange?: (value: string) => void;
  readOnly?: boolean;
}

export default function CodeEditor({ code, language, onChange, readOnly = false }: CodeEditorProps) {
  const getMonacoLanguage = (lang: string): string => {
    const langMap: Record<string, string> = {
      javascript: "javascript",
      typescript: "typescript",
      jsx: "javascript",
      tsx: "typescript",
      html: "html",
      css: "css",
      json: "json",
    };
    return langMap[lang.toLowerCase()] || "plaintext";
  };

  // Properly decode escaped characters from the code
  const decodeCode = (str: string): string => {
    if (!str) return '';
    
    // Replace literal \n, \t, \r with actual newlines/tabs
    return str
      .replace(/\\n/g, '\n')
      .replace(/\\t/g, '\t')
      .replace(/\\r/g, '\r')
      .replace(/\\"/g, '"')
      .replace(/\\'/g, "'");
  };

  const decodedCode = decodeCode(code);

  return (
    <div className="h-full bg-card/50 overflow-hidden" data-testid="code-editor">
      <Editor
        height="100%"
        language={getMonacoLanguage(language)}
        value={decodedCode}
        onChange={(value) => onChange?.(value || "")}
        theme="vs-dark"
        options={{
          readOnly,
          minimap: { enabled: false },
          fontSize: 14,
          lineNumbers: "on",
          scrollBeyondLastLine: false,
          automaticLayout: true,
          tabSize: 2,
          wordWrap: "on",
          padding: { top: 16, bottom: 16 },
        }}
      />
    </div>
  );
}
