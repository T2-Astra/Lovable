import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { History, Loader2, Trash2, FolderOpen, FileCode, Calendar } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import type { Project } from "@shared/schema";

interface ProjectHistoryProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLoadProject: (project: Project) => void;
}

export function ProjectHistory({ open, onOpenChange, onLoadProject }: ProjectHistoryProps) {
  const { toast } = useToast();
  
  const { data: history = [], isLoading } = useQuery<Project[]>({
    queryKey: ['/api/projects/history'],
    enabled: open,
  });
  
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest('DELETE', `/api/projects/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/projects/history'] });
      toast({
        title: "Project deleted",
        description: "The project has been removed from history.",
      });
    },
    onError: (error) => {
      toast({
        title: "Delete failed",
        description: error instanceof Error ? error.message : "Failed to delete project",
        variant: "destructive",
      });
    },
  });
  
  const handleLoadProject = (project: Project) => {
    onLoadProject(project);
    onOpenChange(false);
    toast({
      title: "Project loaded",
      description: `${project.name} has been loaded.`,
    });
  };
  
  const handleDeleteProject = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this project?")) {
      deleteMutation.mutate(id);
    }
  };
  
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-xl">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <History className="w-5 h-5" />
            Project History
          </SheetTitle>
          <SheetDescription>
            View and load your previously saved projects
          </SheetDescription>
        </SheetHeader>
        
        <ScrollArea className="h-[calc(100vh-8rem)] mt-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12" data-testid="loading-history">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : history.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center" data-testid="empty-history">
              <FolderOpen className="w-16 h-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No saved projects</h3>
              <p className="text-sm text-muted-foreground">
                Projects you save will appear here for easy access
              </p>
            </div>
          ) : (
            <div className="space-y-4 pr-4">
              {history.map((project) => (
                <Card
                  key={project.id}
                  className="hover-elevate active-elevate-2 cursor-pointer transition-all"
                  onClick={() => handleLoadProject(project)}
                  data-testid={`card-project-${project.id}`}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-base truncate" data-testid={`text-project-name-${project.id}`}>
                          {project.name}
                        </CardTitle>
                        <CardDescription className="flex items-center gap-2 mt-1">
                          <Calendar className="w-3 h-3" />
                          <span className="text-xs" data-testid={`text-project-date-${project.id}`}>
                            {format(new Date(project.createdAt), 'MMM d, yyyy h:mm a')}
                          </span>
                        </CardDescription>
                      </div>
                      {project.templateId && (
                        <Badge variant="secondary" className="shrink-0" data-testid={`badge-template-${project.id}`}>
                          {project.templateId}
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  
                  <CardContent className="pb-3">
                    <p className="text-xs text-muted-foreground line-clamp-2" data-testid={`text-project-prompt-${project.id}`}>
                      {project.prompt}
                    </p>
                    <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <FileCode className="w-3 h-3" />
                        <span>{project.files.length} files</span>
                      </div>
                      {Object.keys(project.dependencies).length > 0 && (
                        <div className="flex items-center gap-1">
                          <span>{Object.keys(project.dependencies).length} dependencies</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                  
                  <CardFooter className="pt-0 flex justify-between gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleLoadProject(project)}
                      data-testid={`button-load-${project.id}`}
                    >
                      <FolderOpen className="w-3 h-3 mr-1" />
                      Load
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => handleDeleteProject(e, project.id)}
                      disabled={deleteMutation.isPending}
                      data-testid={`button-delete-${project.id}`}
                    >
                      {deleteMutation.isPending ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Trash2 className="w-3 h-3" />
                      )}
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
