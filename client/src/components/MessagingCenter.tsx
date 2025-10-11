import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageSquare, Mail, Send, Paperclip, MoreVertical } from "lucide-react";
import { SiWhatsapp } from "react-icons/si";

interface Message {
  id: string;
  sender: string;
  text: string;
  time: string;
  isOwn: boolean;
}

export function MessagingCenter() {
  const [activeConversation, setActiveConversation] = useState("1");
  const [message, setMessage] = useState("");

  const conversations = [
    { id: "1", name: "Sarah Johnson", lastMessage: "Thanks for the info!", time: "2m ago", unread: 2, channel: "whatsapp" },
    { id: "2", name: "Michael Chen", lastMessage: "Can we schedule viewing?", time: "15m ago", unread: 0, channel: "email" },
    { id: "3", name: "Emma Wilson", lastMessage: "What's the final price?", time: "1h ago", unread: 1, channel: "sms" },
  ];

  const messages: Message[] = [
    { id: "1", sender: "Sarah Johnson", text: "Hi, I'm interested in the villa", time: "10:30 AM", isOwn: false },
    { id: "2", sender: "You", text: "Great! Let me share the details", time: "10:32 AM", isOwn: true },
    { id: "3", sender: "Sarah Johnson", text: "Thanks for the info!", time: "10:35 AM", isOwn: false },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
      <Card className="lg:col-span-1 p-4 flex flex-col">
        <Tabs defaultValue="whatsapp" className="flex-1 flex flex-col">
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="whatsapp" data-testid="tab-whatsapp">
              <SiWhatsapp className="h-4 w-4" />
            </TabsTrigger>
            <TabsTrigger value="email" data-testid="tab-email">
              <Mail className="h-4 w-4" />
            </TabsTrigger>
            <TabsTrigger value="sms" data-testid="tab-sms">
              <MessageSquare className="h-4 w-4" />
            </TabsTrigger>
          </TabsList>
          <TabsContent value="whatsapp" className="flex-1 overflow-auto">
            {conversations
              .filter(c => c.channel === "whatsapp")
              .map((conv) => (
                <div
                  key={conv.id}
                  className={`p-3 rounded-md mb-2 cursor-pointer hover-elevate ${activeConversation === conv.id ? 'bg-accent' : ''}`}
                  onClick={() => setActiveConversation(conv.id)}
                  data-testid={`conversation-${conv.id}`}
                >
                  <div className="flex items-start gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback>{conv.name[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-medium text-sm truncate">{conv.name}</p>
                        <span className="text-xs text-muted-foreground">{conv.time}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground truncate">{conv.lastMessage}</p>
                        {conv.unread > 0 && (
                          <Badge className="ml-2">{conv.unread}</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
          </TabsContent>
          <TabsContent value="email" className="flex-1">
            <p className="text-sm text-muted-foreground text-center py-8">Email conversations</p>
          </TabsContent>
          <TabsContent value="sms" className="flex-1">
            <p className="text-sm text-muted-foreground text-center py-8">SMS conversations</p>
          </TabsContent>
        </Tabs>
      </Card>

      <Card className="lg:col-span-2 p-4 flex flex-col">
        <div className="flex items-center justify-between pb-4 border-b">
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarFallback>SJ</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">Sarah Johnson</p>
              <p className="text-sm text-muted-foreground">Active now</p>
            </div>
          </div>
          <Button variant="ghost" size="icon">
            <MoreVertical className="h-5 w-5" />
          </Button>
        </div>

        <div className="flex-1 overflow-auto py-4 space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.isOwn ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[70%] ${msg.isOwn ? 'bg-primary text-primary-foreground' : 'bg-muted'} rounded-lg p-3`}>
                <p className="text-sm">{msg.text}</p>
                <p className={`text-xs mt-1 ${msg.isOwn ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                  {msg.time}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="pt-4 border-t">
          <div className="flex gap-2">
            <Button variant="outline" size="icon" data-testid="button-attach">
              <Paperclip className="h-5 w-5" />
            </Button>
            <Input
              placeholder="Type a message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              data-testid="input-message"
            />
            <Button onClick={() => { console.log('Send:', message); setMessage(''); }} data-testid="button-send">
              <Send className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
