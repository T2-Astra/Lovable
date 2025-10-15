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

  return (
    <div className="h-full bg-card/50 overflow-hidden" data-testid="code-editor">
      <Editor
        height="100%"
        language={getMonacoLanguage(language)}
        value={code}
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
