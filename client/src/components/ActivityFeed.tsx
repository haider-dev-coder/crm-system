import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Phone, Mail, FileText, Handshake, Home } from "lucide-react";

interface Activity {
  id: string;
  type: "call" | "email" | "document" | "deal" | "property";
  user: string;
  action: string;
  target: string;
  time: string;
}

const activities: Activity[] = [
  { id: "1", type: "call", user: "JD", action: "called", target: "Sarah Johnson", time: "5 min ago" },
  { id: "2", type: "deal", user: "SM", action: "closed deal with", target: "Michael Chen", time: "1 hour ago" },
  { id: "3", type: "property", user: "MW", action: "added new property", target: "Downtown Condo", time: "2 hours ago" },
  { id: "4", type: "email", user: "ED", action: "sent email to", target: "Emma Wilson", time: "3 hours ago" },
  { id: "5", type: "document", user: "JD", action: "uploaded document", target: "Contract_Villa.pdf", time: "5 hours ago" },
];

const iconMap = {
  call: Phone,
  email: Mail,
  document: FileText,
  deal: Handshake,
  property: Home,
};

export function ActivityFeed() {
  return (
    <Card className="p-6">
      <h3 className="font-semibold mb-4">Recent Activity</h3>
      <div className="space-y-4">
        {activities.map((activity) => {
          const Icon = iconMap[activity.type];
          return (
            <div key={activity.id} className="flex items-start gap-3" data-testid={`activity-${activity.id}`}>
              <Avatar className="h-8 w-8">
                <AvatarFallback className="text-xs">{activity.user}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm">
                    <span className="font-medium">{activity.user}</span>{" "}
                    {activity.action}{" "}
                    <span className="font-medium">{activity.target}</span>
                  </p>
                </div>
                <p className="text-xs text-muted-foreground">{activity.time}</p>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
