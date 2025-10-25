import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check, Code, Layers, Sparkles } from "lucide-react";
import { TEMPLATES, type Template } from "@shared/schema";
import { SiReact, SiNextdotjs } from "react-icons/si";

interface TemplateSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedTemplate?: Template['id'];
  onSelectTemplate: (templateId: Template['id']) => void;
}

const TEMPLATE_ICONS = {
  'react': SiReact,
  'nextjs': SiNextdotjs,
  'vanilla': Code,
};

export function TemplateSelector({ open, onOpenChange, selectedTemplate, onSelectTemplate }: TemplateSelectorProps) {
  const handleSelect = (templateId: Template['id']) => {
    onSelectTemplate(templateId);
    onOpenChange(false);
  };

  const getIcon = (iconName: string) => {
    const IconComponent = TEMPLATE_ICONS[iconName as keyof typeof TEMPLATE_ICONS] || Code;
    return IconComponent;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl" data-testid="dialog-template-selector">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-primary" />
            Choose Your Framework
          </DialogTitle>
          <DialogDescription>
            Select a template to get started with your project. Each template is optimized for different use cases.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          {TEMPLATES.map((template) => {
            const IconComponent = getIcon(template.icon);
            const isSelected = selectedTemplate === template.id;
            
            return (
              <Card
                key={template.id}
                className={`p-6 cursor-pointer hover-elevate active-elevate-2 transition-all relative ${
                  isSelected ? 'ring-2 ring-primary' : ''
                }`}
                onClick={() => handleSelect(template.id)}
                data-testid={`card-template-${template.id}`}
              >
                {isSelected && (
                  <div className="absolute top-3 right-3 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                    <Check className="w-4 h-4 text-primary-foreground" data-testid={`icon-selected-${template.id}`} />
                  </div>
                )}

                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className={`p-3 rounded-md ${
                      template.id === 'react-vite' ? 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400' :
                      template.id === 'nextjs' ? 'bg-slate-900/10 text-slate-900 dark:text-slate-100' :
                      'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400'
                    }`}>
                      <IconComponent className="w-8 h-8" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h3 className="font-semibold text-foreground">
                      {template.name}
                    </h3>
                    <p className="text-xs text-muted-foreground line-clamp-3">
                      {template.description}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {template.techStack.map((tech, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        {tech}
                      </Badge>
                    ))}
                  </div>

                  <Button
                    variant={isSelected ? "default" : "outline"}
                    size="sm"
                    className="w-full"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelect(template.id);
                    }}
                    data-testid={`button-select-${template.id}`}
                  >
                    {isSelected ? (
                      <>
                        <Check className="w-3 h-3 mr-1" />
                        Selected
                      </>
                    ) : (
                      'Select Template'
                    )}
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>

        <div className="flex items-center gap-2 mt-4 p-3 bg-muted/50 rounded-md">
          <Sparkles className="w-4 h-4 text-primary" />
          <p className="text-xs text-muted-foreground">
            Don't worry, you can always describe a different setup in your prompt. These templates provide a starting point.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
