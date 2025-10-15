import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Sparkles, User } from "lucide-react";
import type { Conversation } from "@shared/schema";

interface ConversationHistoryProps {
  conversations: Conversation[];
}

export default function ConversationHistory({ conversations }: ConversationHistoryProps) {
  if (conversations.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground p-8" data-testid="chat-empty">
        <div className="text-center space-y-2">
          <div className="w-16 h-16 mx-auto rounded-lg bg-muted/10 border border-border flex items-center justify-center">
            <Sparkles className="h-8 w-8 opacity-50" />
          </div>
          <p className="font-medium">No conversation yet</p>
          <p className="text-sm">Start by asking Lovable to build something</p>
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
            className={`flex gap-3 ${conversation.role === 'user' ? 'justify-end' : ''}`}
            data-testid={`conversation-${conversation.id}`}
          >
            {conversation.role === 'assistant' && (
              <Avatar className="h-8 w-8 flex-shrink-0">
                <AvatarFallback className="bg-primary text-primary-foreground">
                  <Sparkles className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
            )}

            <Card className={`p-3 max-w-[80%] ${
              conversation.role === 'user' 
                ? 'bg-primary text-primary-foreground' 
                : 'bg-card'
            }`}>
              <div className="space-y-2">
                <p className="text-sm font-medium">
                  {conversation.role === 'user' ? 'You' : 'Lovable'}
                </p>
                <p className="text-sm whitespace-pre-wrap">{conversation.content}</p>
                <p className="text-xs opacity-70">
                  {new Date(conversation.timestamp).toLocaleTimeString()}
                </p>
              </div>
            </Card>

            {conversation.role === 'user' && (
              <Avatar className="h-8 w-8 flex-shrink-0">
                <AvatarFallback className="bg-secondary text-secondary-foreground">
                  <User className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
            )}
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}
