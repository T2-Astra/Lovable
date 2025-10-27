import { useState } from "react";
import { Send, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Aurora from "@/components/Aurora";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Workspace } from "@/components/Workspace";
import { useStreamingGenerate } from "@/hooks/useStreamingGenerate";
import TextType from "@/components/TextType";
import type { GenerationResponse, Template } from "@shared/schema";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Home() {
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [showBuilder, setShowBuilder] = useState(false);
  const { toast } = useToast();
  const streaming = useStreamingGenerate();
  const [selectedTemplate, setSelectedTemplate] = useState<Template['id'] | undefined>(undefined);
  
  const templates = [
    { 
      id: 'react-vite', 
      name: 'React + Vite', 
      icon: <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor"><path d="M14.23 12.004a2.236 2.236 0 0 1-2.235 2.236 2.236 2.236 0 0 1-2.236-2.236 2.236 2.236 0 0 1 2.235-2.236 2.236 2.236 0 0 1 2.236 2.236zm2.648-10.69c-1.346 0-3.107.96-4.888 2.622-1.78-1.653-3.542-2.602-4.887-2.602-.41 0-.783.093-1.106.278-1.375.793-1.683 3.264-.973 6.365C1.98 8.917 0 10.42 0 12.004c0 1.59 1.99 3.097 5.043 4.03-.704 3.113-.39 5.588.988 6.38.32.187.69.275 1.102.275 1.345 0 3.107-.96 4.888-2.624 1.78 1.654 3.542 2.603 4.887 2.603.41 0 .783-.09 1.106-.275 1.374-.792 1.683-3.263.973-6.365C22.02 15.096 24 13.59 24 12.004c0-1.59-1.99-3.097-5.043-4.032.704-3.11.39-5.587-.988-6.38a2.167 2.167 0 0 0-1.092-.278zm-.005 1.09v.006c.225 0 .406.044.558.127.666.382.955 1.835.73 3.704-.054.46-.142.945-.25 1.44a23.476 23.476 0 0 0-3.107-.534A23.892 23.892 0 0 0 12.769 4.7c1.592-1.48 3.087-2.292 4.105-2.295zm-9.77.02c1.012 0 2.514.808 4.11 2.28-.686.72-1.37 1.537-2.02 2.442a22.73 22.73 0 0 0-3.113.538 15.02 15.02 0 0 1-.254-1.42c-.23-1.868.054-3.32.714-3.707.19-.09.4-.127.563-.132zm4.882 3.05c.455.468.91.992 1.36 1.564-.44-.02-.89-.034-1.345-.034-.46 0-.915.01-1.36.034.44-.572.895-1.096 1.345-1.565zM12 8.1c.74 0 1.477.034 2.202.093.406.582.802 1.203 1.183 1.86.372.64.71 1.29 1.018 1.946-.308.655-.646 1.31-1.013 1.95-.38.66-.773 1.288-1.18 1.87a25.64 25.64 0 0 1-4.412.005 26.64 26.64 0 0 1-1.183-1.86c-.372-.64-.71-1.29-1.018-1.946a23.73 23.73 0 0 1 1.013-1.954c.38-.66.773-1.286 1.18-1.868A25.1 25.1 0 0 1 12 8.098zm-3.635.254c-.24.377-.48.763-.704 1.16-.225.39-.435.782-.635 1.174-.265-.656-.49-1.31-.676-1.947.64-.15 1.315-.283 2.015-.386zm7.26 0c.695.103 1.365.23 2.006.387-.18.632-.405 1.282-.66 1.933a25.952 25.952 0 0 0-1.345-2.32zm3.063.675c.484.15.944.317 1.375.498 1.732.74 2.852 1.708 2.852 2.476-.005.768-1.125 1.74-2.857 2.475-.42.18-.88.342-1.355.493a23.966 23.966 0 0 0-1.1-2.98c.45-1.017.81-2.01 1.085-2.964zm-13.395.004c.278.96.645 1.957 1.1 2.98a23.142 23.142 0 0 0-1.086 2.964c-.484-.15-.944-.318-1.37-.5-1.732-.737-2.852-1.706-2.852-2.474 0-.768 1.12-1.742 2.852-2.476.42-.18.88-.342 1.356-.494zm11.678 4.28c.265.657.49 1.312.676 1.948-.64.157-1.316.29-2.016.39a25.819 25.819 0 0 0 1.341-2.338zm-9.945.02c.2.392.41.783.64 1.175.23.39.465.772.705 1.143a22.005 22.005 0 0 1-2.006-.386c.18-.63.406-1.282.66-1.933zM17.92 16.32c.112.493.2.968.254 1.423.23 1.868-.054 3.32-.714 3.708-.147.09-.338.128-.563.128-1.012 0-2.514-.807-4.11-2.28.686-.72 1.37-1.536 2.02-2.44 1.107-.118 2.154-.3 3.113-.54zm-11.83.01c.96.234 2.006.415 3.107.532.66.905 1.345 1.727 2.035 2.446-1.595 1.483-3.092 2.295-4.11 2.295a1.185 1.185 0 0 1-.553-.132c-.666-.38-.955-1.834-.73-3.703.054-.46.142-.944.25-1.438zm4.56.64c.44.02.89.034 1.345.034.46 0 .915-.01 1.36-.034-.44.572-.895 1.095-1.345 1.565-.455-.47-.91-.993-1.36-1.565z"/></svg>,
      color: 'text-cyan-500'
    },
    { 
      id: 'nextjs', 
      name: 'Next.js', 
      icon: <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor"><path d="M11.5725 0c-.1763 0-.3098.0013-.3584.0067-.0516.0053-.2159.021-.3636.0328-3.4088.3073-6.6017 2.1463-8.624 4.9728C1.1004 6.584.3802 8.3666.1082 10.255c-.0962.659-.108.8537-.108 1.7474s.012 1.0884.108 1.7476c.652 4.506 3.8591 8.2919 8.2087 9.6945.7789.2511 1.6.4223 2.5337.5255.3636.04 1.9354.04 2.299 0 1.6117-.1783 2.9772-.577 4.3237-1.2643.2065-.1056.2464-.1337.2183-.1573-.0188-.0139-.8987-1.1938-1.9543-2.62l-1.919-2.592-2.4047-3.5583c-1.3231-1.9564-2.4117-3.556-2.4211-3.556-.0094-.0026-.0187 1.5787-.0235 3.509-.0067 3.3802-.0093 3.5162-.0516 3.596-.061.115-.108.1618-.2064.2134-.075.0374-.1408.0445-.495.0445h-.406l-.1078-.068a.4383.4383 0 01-.1572-.1712l-.0493-.1056.0053-4.703.0067-4.7054.0726-.0915c.0376-.0493.1174-.1125.1736-.143.0962-.047.1338-.0517.5396-.0517.4787 0 .5584.0187.6827.1547.0353.0377 1.3373 1.9987 2.895 4.3608a10760.433 10760.433 0 004.7344 7.1706l1.9002 2.8782.096-.0633c.8518-.5536 1.7525-1.3418 2.4657-2.1627 1.5179-1.7429 2.4963-3.868 2.8247-6.134.0961-.6591.1078-.854.1078-1.7475 0-.8937-.012-1.0884-.1078-1.7476-.6522-4.506-3.8592-8.2919-8.2087-9.6945-.7672-.2487-1.5836-.42-2.4985-.5232-.169-.0176-1.0835-.0366-1.6123-.037zm4.0685 7.217c.3473 0 .4082.0053.4857.047.1127.0562.204.1642.237.2767.0186.061.0234 1.3653.0186 4.3044l-.0067 4.2175-.7436-1.14-.7461-1.14v-3.066c0-1.982.0093-3.0963.0234-3.1502.0375-.1313.1196-.2346.2323-.2955.0961-.0494.1313-.054.4997-.054z"/></svg>,
      color: 'text-foreground'
    },
    { 
      id: 'html-css-js', 
      name: 'HTML + CSS + JS', 
      icon: <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor"><path d="M1.5 0h21l-1.91 21.563L11.977 24l-8.564-2.438L1.5 0zm7.031 9.75l-.232-2.718 10.059.003.23-2.622L5.412 4.41l.698 8.01h9.126l-.326 3.426-2.91.804-2.955-.81-.188-2.11H6.248l.33 4.171L12 19.351l5.379-1.443.744-8.157H8.531z"/></svg>,
      color: 'text-orange-500'
    },
  ] as const;

  const handleGenerate = async (promptText?: string): Promise<GenerationResponse> => {
    const finalPrompt = promptText || prompt;
    
    if (!finalPrompt.trim()) {
      toast({
        title: "Prompt required",
        description: "Please describe what you'd like to build",
        variant: "destructive",
      });
      throw new Error("Prompt required");
    }

    if (isGenerating) {
      throw new Error("Already generating");
    }

    setIsGenerating(true);
    setShowBuilder(true);
    setPrompt("");

    try {
      const result = await streaming.generate(finalPrompt, selectedTemplate);
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
      setShowBuilder(false);
      throw error;
    } finally {
      setIsGenerating(false);
    }
  };
  
  // Show builder interface if generation started
  if (showBuilder) {
  return (
    <Workspace 
      onGenerate={handleGenerate} 
      generatedProject={streaming.project}
      isGenerating={streaming.isStreaming}
      streamingStatus={streaming.status}
      streamingFileName={streaming.fileName}
      streamingProgress={streaming.progress}
      selectedTemplate={selectedTemplate}
      onTemplateChange={setSelectedTemplate}
        onBack={() => setShowBuilder(false)}
      />
    );
  }

  // Landing Page
  return (
    <div className="h-screen w-screen bg-background overflow-hidden">
      {/* Hero Section with Gradient */}
      <div className="relative h-full w-full">
        {/* Aurora Background */}
        <div className="absolute inset-0 z-0">
          <Aurora
            colorStops={["#0ea5e9", "#10b981", "#06b6d4"]}
            blend={0.5}
            amplitude={1.0}
            speed={0.5}
          />
        </div>
        
        {/* Grain Texture Overlay */}
        <div 
          className="absolute inset-0 z-0" 
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.4'/%3E%3C/svg%3E")`,
            backgroundSize: '100px 100px',
            backgroundRepeat: 'repeat',
            backgroundBlendMode: 'overlay',
            backgroundPosition: 'left top',
            mixBlendMode: 'overlay',
            opacity: 0.3
          }}
        />

        {/* Hamburger Menu - Top Right Corner */}
        <div className="fixed top-4 right-4 z-50">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button 
                className="flex items-center justify-center p-1 hover:opacity-70 transition-opacity"
                aria-label="Open menu"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-foreground">
                  <line x1="4" x2="20" y1="12" y2="12"></line>
                  <line x1="4" x2="20" y1="6" y2="6"></line>
                  <line x1="4" x2="20" y1="18" y2="18"></line>
                </svg>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40 z-50">
              <DropdownMenuItem asChild>
                <a href="/" className="w-full cursor-pointer">Home</a>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <a href="#community" className="w-full cursor-pointer">Community</a>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <a href="#pricing" className="w-full cursor-pointer">Pricing</a>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <a href="#learn" className="w-full cursor-pointer">Learn</a>
              </DropdownMenuItem>
              <div className="h-px bg-border my-1" />
              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                <ThemeToggle />
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Main Content - Centered */}
        <section className="relative z-10 h-full flex w-full flex-col items-center justify-center">
          <div className="relative mb-4 flex flex-col items-center px-4 text-center md:mb-6">
            <div className="flex w-full flex-col items-center justify-center gap-2"></div>
            <h1 className="mb-2 flex items-center gap-1 text-3xl font-medium leading-none text-foreground sm:text-3xl md:mb-2.5 md:gap-0 md:text-5xl">
              <span className="pt-0.5 tracking-tight md:pt-0">Build something </span>
              <div className="flex flex-col gap-1.5 ml-2 sm:ml-3 md:ml-4">
                <TextType
                  text={["Amazing", "Beautiful", "Powerful"]}
                  as="span"
                  typingSpeed={100}
                  pauseDuration={2000}
                  deletingSpeed={50}
                  loop={true}
                  showCursor={true}
                  cursorCharacter="|"
                  variableSpeed={undefined}
                  onSentenceComplete={undefined}
                  className="bg-gradient-to-r from-[#0ea5e9] via-[#10b981] to-[#06b6d4] bg-clip-text text-transparent font-bold tracking-tight text-3xl sm:text-3xl md:text-5xl"
                />
              </div>
            </h1>
            <p className="mb-6 max-w-[25ch] text-center text-lg leading-tight text-foreground/65 md:max-w-full md:text-xl">Create apps and websites by chatting with AI</p>
          </div>
          <div className="w-full max-w-xl px-4">
            <div className="relative w-full">
              <div className="flex w-full flex-col items-center">
                <div className="relative size-full">
                  <form 
                    id="chat-input" 
                    className="group flex flex-col gap-1.5 p-2.5 w-full rounded-3xl border border-black dark:border-white bg-card/50 backdrop-blur-sm text-base shadow-xl"
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleGenerate();
                    }}
                  >
                    <div className="relative flex flex-1 items-center">
                      <textarea
                        className="flex w-full rounded-md px-2 py-2 ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 resize-none text-[16px] leading-snug placeholder-shown:text-ellipsis placeholder-shown:whitespace-nowrap md:text-base focus-visible:ring-0 focus-visible:ring-offset-0 max-h-[max(35svh,5rem)] bg-transparent focus:bg-transparent flex-1"
                        id="chatinput"
                        autoFocus
                        style={{minHeight: '65px', height: '65px'}}
                        placeholder="Ask Astra to create a web app that..."
                        maxLength={50000}
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleGenerate();
                          }
                        }}
                        disabled={isGenerating}
                      />
                    </div>
                    <div className="flex gap-1 flex-wrap items-center">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button 
                            className="inline-flex items-center justify-center whitespace-nowrap text-sm font-medium transition-colors duration-100 ease-in-out focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none border border-input bg-muted hover:bg-accent hover:border-accent py-2 h-10 w-10 gap-1.5 rounded-full px-3 text-muted-foreground hover:text-foreground md:h-8 md:w-fit" 
                            type="button"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" width="100%" height="100%" className="shrink-0 h-4 w-4">
                              <path fill="currentColor" d="M5.25 15V8a.75.75 0 0 1 1.5 0v7a5.25 5.25 0 1 0 10.5 0V7a3.25 3.25 0 0 0-6.5 0v8a1.25 1.25 0 1 0 2.5 0V8a.75.75 0 0 1 1.5 0v7a2.75 2.75 0 1 1-5.5 0V7a4.75 4.75 0 1 1 9.5 0v8a6.75 6.75 0 0 1-13.5 0"></path>
                            </svg>
                            <span className="hidden md:flex">
                              {selectedTemplate 
                                ? templates.find(t => t.id === selectedTemplate)?.name 
                                : 'Template'}
                            </span>
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-56 p-2">
                          {templates.map((template) => (
                            <DropdownMenuItem
                              key={template.id}
                              onClick={() => setSelectedTemplate(template.id)}
                              className="flex items-center justify-between cursor-pointer rounded-lg px-3 py-2.5 hover:bg-accent/50 transition-colors"
                            >
                              <span className="flex items-center gap-3">
                                <span className={template.color}>{template.icon}</span>
                                <span className="font-medium">{template.name}</span>
                              </span>
                              {selectedTemplate === template.id && (
                                <Check className="h-4 w-4 text-primary" />
                              )}
                            </DropdownMenuItem>
                          ))}
                          {selectedTemplate && (
                            <>
                              <div className="h-px bg-border my-1" />
                              <DropdownMenuItem
                                onClick={() => setSelectedTemplate(undefined)}
                                className="text-muted-foreground cursor-pointer"
                              >
                                Clear selection
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                      <input id="file-upload" className="hidden" multiple type="file" style={{border:0,clip:'rect(0, 0, 0, 0)',clipPath:'inset(50%)',height:'1px',margin:'0 -1px -1px 0',overflow:'hidden',padding:0,position:'absolute',width:'1px',whiteSpace:'nowrap'}} tabIndex={-1} />
                      <div className="ml-auto flex items-center gap-1">
                        <div className="relative flex items-center gap-1 md:gap-2">
                          <div className=""></div>
                          <button 
                            className="gap-2 whitespace-nowrap text-sm font-medium ease-in-out focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none [&_svg]:pointer-events-none border border-input bg-muted hover:bg-accent hover:border-accent relative z-10 flex rounded-full p-0 text-muted-foreground transition-opacity duration-150 disabled:cursor-not-allowed disabled:opacity-50 items-center justify-center h-10 w-10 md:h-8 md:w-8" 
                            type="button"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" width="100%" height="100%" className="shrink-0 relative z-10 h-5 w-5">
                              <path fill="currentColor" d="M11.25 20V4a.75.75 0 0 1 1.5 0v16a.75.75 0 0 1-1.5 0m8-2V6a.75.75 0 0 1 1.5 0v12a.75.75 0 0 1-1.5 0m-12-1V7a.75.75 0 0 1 1.5 0v10a.75.75 0 0 1-1.5 0m8-2V9a.75.75 0 0 1 1.5 0v6a.75.75 0 0 1-1.5 0m-12-1v-4a.75.75 0 0 1 1.5 0v4a.75.75 0 0 1-1.5 0"></path>
                            </svg>
                          </button>
                          <button 
                            id="chatinput-send-message-button" 
                            type="submit" 
                            className="flex h-10 w-10 items-center justify-center rounded-full bg-foreground transition-opacity duration-150 ease-out disabled:cursor-not-allowed disabled:opacity-50 md:h-8 md:w-8" 
                            disabled={isGenerating || !prompt.trim()}
                          >
                            {isGenerating ? (
                              <div className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                            ) : (
                              <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" width="100%" height="100%" className="shrink-0 h-6 w-6 text-background">
                                <path fill="currentColor" d="M11 19V7.415l-3.293 3.293a1 1 0 1 1-1.414-1.414l5-5 .074-.067a1 1 0 0 1 1.34.067l5 5a1 1 0 1 1-1.414 1.414L13 7.415V19a1 1 0 1 1-2 0"></path>
                              </svg>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
