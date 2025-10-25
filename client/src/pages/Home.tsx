import { Workspace } from "@/components/Workspace";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { GenerationResponse } from "@shared/schema";

export default function Home() {
  const { toast } = useToast();
  
  const generateMutation = useMutation({
    mutationFn: async (data: { prompt: string; template?: string }) => {
      const response = await apiRequest<GenerationResponse>(
        'POST',
        '/api/generate',
        data
      );
      return response;
    },
    onSuccess: (data) => {
      toast({
        title: "Generation Complete!",
        description: `Successfully generated ${data.files.length} files`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Generation Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const handleGenerate = async (prompt: string, template?: string): Promise<GenerationResponse> => {
    return new Promise((resolve, reject) => {
      generateMutation.mutate(
        { prompt, template },
        {
          onSuccess: (data) => resolve(data),
          onError: (error) => reject(error),
        }
      );
    });
  };
  
  return (
    <Workspace 
      onGenerate={handleGenerate} 
      generatedProject={generateMutation.data}
      isGenerating={generateMutation.isPending}
    />
  );
}
