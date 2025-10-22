import { useRef, useEffect } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Sparkles, User } from "lucide-react";
import type { Conversation } from "@shared/schema";

interface ConversationHistoryProps {
  conversations: Conversation[];
}

export default function ConversationHistory({ conversations }: ConversationHistoryProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversations]);
  if (conversations.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground p-8" data-testid="chat-empty">
        <div className="text-center space-y-2">
          <div className="w-16 h-16 mx-auto rounded-lg bg-muted/10 border border-border flex items-center justify-center">
            <Sparkles className="h-8 w-8 opacity-50" />
          </div>
          <p className="font-medium">No conversation yet</p>
          <p className="text-sm">Start by asking Astra to build something</p>
        </div>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full" data-testid="conversation-history">
      <div className="p-4 space-y-4">
        {conversations.map((conversation) => (
          <div
            key={conversation.id}
            className={`${conversation.role === 'user' ? 'flex justify-end' : 'flex flex-col pr-2 pb-4'}`}
            data-testid={`conversation-${conversation.id}`}
          >
            {conversation.role === 'user' ? (
              // User message - with card
              <Card className="max-w-[80%] bg-secondary text-foreground px-3 py-3">
                <div className="text-lg md:text-base leading-[22px] whitespace-pre-wrap">
                  {conversation.content}
                </div>
              </Card>
            ) : (
              // AI message - no card, just label and text
              <>
                <div className="mb-3 flex items-center gap-2 pl-2 text-sm text-muted-foreground">
                  <Sparkles className="h-3.5 w-3.5" />
                  <span className="font-medium">Astra</span>
                </div>
                <div className="pl-2 text-base leading-[22px] whitespace-pre-wrap">
                  {conversation.content}
                </div>
              </>
            )}
          </div>
        ))}
        {/* Invisible element at the end for auto-scroll */}
        <div ref={messagesEndRef} />
      </div>
    </ScrollArea>
  );
}
