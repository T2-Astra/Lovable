import { useState, useEffect } from "react";
import { MonacoEditor } from "./MonacoEditor";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileCode, Eye, Edit, Save, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { ProjectFile } from "@shared/schema";

interface CodeEditorProps {
  file?: ProjectFile;
  onSave?: (file: ProjectFile, newContent: string) => void;
  modifiedFiles?: Set<string>;
}

export function CodeEditor({ file, onSave, modifiedFiles }: CodeEditorProps) {
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedContent, setEditedContent] = useState("");
  const [isSaved, setIsSaved] = useState(false);
  const { toast } = useToast();
  
  useEffect(() => {
    if (file) {
      setEditedContent(file.content);
      setIsEditMode(false);
      setIsSaved(false);
    }
  }, [file?.path]);
  
  useEffect(() => {
    if (!isEditMode) {
      return;
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isEditMode, editedContent, file]);
  
  const handleSave = () => {
    if (!file || !onSave) return;
    
    onSave(file, editedContent);
    setIsSaved(true);
    
    toast({
      title: "File saved",
      description: `${file.path} has been saved successfully`,
      duration: 2000,
    });
    
    setTimeout(() => {
      setIsSaved(false);
    }, 2000);
  };
  
  const handleToggleMode = () => {
    if (isEditMode && editedContent !== file?.content) {
      const shouldDiscard = window.confirm(
        "You have unsaved changes. Discard them?"
      );
      if (!shouldDiscard) return;
      
      if (file) {
        setEditedContent(file.content);
      }
    }
    setIsEditMode(!isEditMode);
    setIsSaved(false);
  };
  
  const handleContentChange = (value: string) => {
    setEditedContent(value);
    setIsSaved(false);
  };
  
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
  
  const hasUnsavedChanges = isEditMode && editedContent !== file.content;
  const isModified = modifiedFiles?.has(file.path) || false;
  
  return (
    <div className="h-full flex flex-col">
      {/* File Header */}
      <div className="flex items-center justify-between gap-4 p-3 border-b border-border bg-card">
        <div className="flex items-center gap-3 min-w-0">
          <FileCode className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          <span className="text-sm font-medium truncate" data-testid="text-filename">
            {file.path}
          </span>
          {isModified && (
            <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0" title="Modified" />
          )}
          {hasUnsavedChanges && (
            <Badge variant="secondary" className="text-xs">
              Unsaved
            </Badge>
          )}
          {isSaved && (
            <Badge variant="secondary" className="text-xs gap-1">
              <Check className="w-3 h-3" />
              Saved
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {isEditMode && (
            <Button
              variant="default"
              size="sm"
              onClick={handleSave}
              disabled={!hasUnsavedChanges}
              className="gap-1.5"
              data-testid="button-save"
            >
              <Save className="w-3.5 h-3.5" />
              Save
            </Button>
          )}
          <Button
            variant={isEditMode ? "secondary" : "outline"}
            size="sm"
            onClick={handleToggleMode}
            className="gap-1.5"
            data-testid="button-toggle-mode"
          >
            {isEditMode ? (
              <>
                <Eye className="w-3.5 h-3.5" />
                View
              </>
            ) : (
              <>
                <Edit className="w-3.5 h-3.5" />
                Edit
              </>
            )}
          </Button>
          <Badge variant="secondary" className="text-xs">
            {getLanguageLabel(file.language)}
          </Badge>
        </div>
      </div>
      
      {/* Monaco Editor */}
      <div className="flex-1 overflow-hidden bg-background">
        <MonacoEditor
          file={{ ...file, content: isEditMode ? editedContent : file.content }}
          onChange={handleContentChange}
          readOnly={!isEditMode}
        />
      </div>
      
      {/* Status Bar */}
      <div className="flex items-center justify-between px-3 py-1.5 border-t border-border bg-card text-xs text-muted-foreground">
        <div className="flex items-center gap-3">
          <span>{getLanguageLabel(file.language)}</span>
          <span>UTF-8</span>
          {isEditMode && <span className="text-primary">Edit Mode</span>}
        </div>
        <div className="flex items-center gap-3">
          <span>{(isEditMode ? editedContent : file.content).split('\n').length} lines</span>
          <span>{(isEditMode ? editedContent : file.content).length} chars</span>
        </div>
      </div>
    </div>
  );
}
