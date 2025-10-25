import { useState } from "react";
import { ChevronRight, ChevronDown, File, Folder, FolderOpen } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { ProjectFile } from "@shared/schema";

interface FileTreeProps {
  files: ProjectFile[];
  onFileSelect?: (file: ProjectFile) => void;
  selectedFile?: string;
}

interface TreeNode {
  name: string;
  path: string;
  type: 'file' | 'folder';
  children?: TreeNode[];
  file?: ProjectFile;
}

function buildTree(files: ProjectFile[]): TreeNode[] {
  const root: TreeNode[] = [];
  
  files.forEach(file => {
    const parts = file.path.split('/');
    let currentLevel = root;
    
    parts.forEach((part, index) => {
      const isFile = index === parts.length - 1;
      const path = parts.slice(0, index + 1).join('/');
      
      let node = currentLevel.find(n => n.name === part);
      
      if (!node) {
        node = {
          name: part,
          path,
          type: isFile ? 'file' : 'folder',
          children: isFile ? undefined : [],
          file: isFile ? file : undefined
        };
        currentLevel.push(node);
      }
      
      if (!isFile && node.children) {
        currentLevel = node.children;
      }
    });
  });
  
  return root;
}

function TreeItem({ 
  node, 
  level = 0, 
  onFileSelect, 
  selectedFile 
}: { 
  node: TreeNode; 
  level?: number; 
  onFileSelect?: (file: ProjectFile) => void;
  selectedFile?: string;
}) {
  const [isOpen, setIsOpen] = useState(level === 0);
  
  const handleClick = () => {
    if (node.type === 'folder') {
      setIsOpen(!isOpen);
    } else if (node.file && onFileSelect) {
      onFileSelect(node.file);
    }
  };
  
  const isSelected = selectedFile === node.path;
  
  return (
    <div>
      <div
        className={`
          flex items-center gap-2 py-1.5 px-2 rounded-md cursor-pointer text-sm
          hover-elevate active-elevate-2
          ${isSelected ? 'bg-accent text-accent-foreground' : 'text-foreground'}
        `}
        style={{ paddingLeft: `${level * 12 + 8}px` }}
        onClick={handleClick}
        data-testid={`tree-item-${node.path}`}
      >
        {node.type === 'folder' ? (
          <>
            {isOpen ? (
              <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            ) : (
              <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            )}
            {isOpen ? (
              <FolderOpen className="w-4 h-4 text-primary flex-shrink-0" />
            ) : (
              <Folder className="w-4 h-4 text-primary flex-shrink-0" />
            )}
          </>
        ) : (
          <>
            <div className="w-4" />
            <File className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          </>
        )}
        <span className="truncate flex-1">{node.name}</span>
      </div>
      
      {node.type === 'folder' && isOpen && node.children && (
        <div>
          {node.children.map((child, idx) => (
            <TreeItem
              key={idx}
              node={child}
              level={level + 1}
              onFileSelect={onFileSelect}
              selectedFile={selectedFile}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function FileTree({ files, onFileSelect, selectedFile }: FileTreeProps) {
  const tree = buildTree(files);
  
  if (files.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-sm text-muted-foreground p-4">
        No files generated yet
      </div>
    );
  }
  
  return (
    <ScrollArea className="h-full">
      <div className="p-2 space-y-0.5">
        {tree.map((node, idx) => (
          <TreeItem
            key={idx}
            node={node}
            onFileSelect={onFileSelect}
            selectedFile={selectedFile}
          />
        ))}
      </div>
    </ScrollArea>
  );
}
