import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Trophy, TrendingUp } from "lucide-react";

interface Agent {
  id: string;
  name: string;
  role: string;
  deals: number;
  revenue: string;
  rank: number;
}

const agents: Agent[] = [
  { id: "1", name: "John Doe", role: "Senior Agent", deals: 24, revenue: "$2.1M", rank: 1 },
  { id: "2", name: "Sarah Miller", role: "Agent", deals: 21, revenue: "$1.8M", rank: 2 },
  { id: "3", name: "Mike Wilson", role: "Agent", deals: 18, revenue: "$1.5M", rank: 3 },
  { id: "4", name: "Emma Davis", role: "Junior Agent", deals: 15, revenue: "$1.2M", rank: 4 },
];

export function AgentLeaderboard() {
  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-6">
        <Trophy className="h-5 w-5 text-warning" />
        <h3 className="font-semibold">Top Performers This Month</h3>
      </div>
      <div className="space-y-4">
        {agents.map((agent) => (
          <div
            key={agent.id}
            className="flex items-center justify-between p-3 rounded-md hover-elevate"
            data-testid={`row-agent-${agent.id}`}
          >
            <div className="flex items-center gap-3">
              <div className="relative">
                <Avatar>
                  <AvatarFallback>{agent.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                </Avatar>
                {agent.rank <= 3 && (
                  <div className={`absolute -top-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    agent.rank === 1 ? 'bg-warning text-white' :
                    agent.rank === 2 ? 'bg-muted text-foreground' :
                    'bg-warning/30 text-warning'
                  }`}>
                    {agent.rank}
                  </div>
                )}
              </div>
              <div>
                <p className="font-medium" data-testid={`text-name-${agent.id}`}>{agent.name}</p>
                <p className="text-sm text-muted-foreground">{agent.role}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-semibold" data-testid={`text-revenue-${agent.id}`}>{agent.revenue}</p>
              <div className="flex items-center gap-1 text-sm text-success">
                <TrendingUp className="h-3 w-3" />
                <span>{agent.deals} deals</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
