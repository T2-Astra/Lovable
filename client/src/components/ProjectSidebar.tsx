import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, Folder, FileCode, Trash2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import type { Project, CodeFile } from "@shared/schema";

interface ProjectSidebarProps {
  currentProjectId: string | null;
  onProjectSelect: (projectId: string) => void;
  codeFiles: CodeFile[];
  onFileSelect: (file: CodeFile) => void;
  selectedFile: CodeFile | null;
}

export default function ProjectSidebar({
  currentProjectId,
  onProjectSelect,
  codeFiles,
  onFileSelect,
  selectedFile,
}: ProjectSidebarProps) {
  const [newProjectName, setNewProjectName] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();

  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ['/api/projects'],
  });

  const createProjectMutation = useMutation({
    mutationFn: async (name: string) => {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, description: null }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create project');
      }
      
      return response.json();
    },
    onSuccess: (newProject) => {
      queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
      onProjectSelect(newProject.id);
      setDialogOpen(false);
      setNewProjectName("");
      toast({
        title: "Project created",
        description: `${newProject.name} has been created successfully`,
      });
    },
  });

  const handleCreateProject = () => {
    if (!newProjectName.trim()) {
      toast({
        title: "Name required",
        description: "Please enter a project name",
        variant: "destructive",
      });
      return;
    }
    createProjectMutation.mutate(newProjectName);
  };

  return (
    <div className="h-full flex flex-col" data-testid="project-sidebar">
      {/* Projects Section */}
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-muted-foreground">Projects</h3>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8" data-testid="button-new-project">
                <Plus className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Project</DialogTitle>
                <DialogDescription>
                  Start a new project and begin building with AI
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="project-name">Project Name</Label>
                  <Input
                    id="project-name"
                    placeholder="My Awesome App"
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    data-testid="input-project-name"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button 
                  onClick={handleCreateProject}
                  disabled={createProjectMutation.isPending}
                  data-testid="button-create-project"
                >
                  {createProjectMutation.isPending ? "Creating..." : "Create Project"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <ScrollArea className="h-48">
          <div className="space-y-1">
            {projects.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No projects yet
              </p>
            ) : (
              projects.map((project) => (
                <Button
                  key={project.id}
                  variant={currentProjectId === project.id ? "secondary" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => onProjectSelect(project.id)}
                  data-testid={`project-${project.id}`}
                >
                  <Folder className="h-4 w-4 mr-2" />
                  <span className="truncate">{project.name}</span>
                </Button>
              ))
            )}
          </div>
        </ScrollArea>
      </div>

      <Separator />

      {/* Files Section */}
      <div className="flex-1 flex flex-col p-4 overflow-hidden">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-muted-foreground">Files</h3>
        </div>

        {currentProjectId ? (
          <ScrollArea className="flex-1">
            <div className="space-y-1">
              {codeFiles.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No files yet
                </p>
              ) : (
                codeFiles.map((file) => (
                  <Button
                    key={file.id}
                    variant={selectedFile?.id === file.id ? "secondary" : "ghost"}
                    className="w-full justify-start font-mono text-xs"
                    onClick={() => onFileSelect(file)}
                    data-testid={`file-${file.id}`}
                  >
                    <FileCode className="h-4 w-4 mr-2 flex-shrink-0" />
                    <span className="truncate">{file.filename}</span>
                  </Button>
                ))
              )}
            </div>
          </ScrollArea>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <p className="text-sm text-center">
              Select a project<br />to view files
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
