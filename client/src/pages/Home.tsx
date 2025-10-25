import { Workspace } from "@/components/Workspace";
import { useStreamingGenerate } from "@/hooks/useStreamingGenerate";
import { useToast } from "@/hooks/use-toast";
import type { GenerationResponse } from "@shared/schema";

export default function Home() {
  const { toast } = useToast();
  const streaming = useStreamingGenerate();
  
  const handleGenerate = async (prompt: string, template?: string): Promise<GenerationResponse> => {
    try {
      const result = await streaming.generate(prompt, template);
      toast({
        title: "Generation Complete!",
        description: `Successfully generated ${result.files.length} files`,
      });
      return result;
    } catch (error) {
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: "destructive",
      });
      throw error;
    }
  };
  
  return (
    <Workspace 
      onGenerate={handleGenerate} 
      generatedProject={streaming.project}
      isGenerating={streaming.isStreaming}
      streamingStatus={streaming.status}
      streamingFileName={streaming.fileName}
      streamingProgress={streaming.progress}
    />
  );
}
