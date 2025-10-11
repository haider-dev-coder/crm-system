import { AgentLeaderboard } from "@/components/AgentLeaderboard";
import { PerformanceChart } from "@/components/PerformanceChart";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

export default function Reports() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold mb-2">Reports & Analytics</h1>
          <p className="text-muted-foreground">Performance insights and metrics</p>
        </div>
        <Button variant="outline" data-testid="button-export">
          <Download className="h-4 w-4 mr-2" />
          Export Report
        </Button>
      </div>

      <PerformanceChart />

      <AgentLeaderboard />
    </div>
  );
}
