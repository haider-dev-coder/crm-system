import { DashboardMetricCard } from "@/components/DashboardMetricCard";
import { ActivityFeed } from "@/components/ActivityFeed";
import { PerformanceChart } from "@/components/PerformanceChart";
import { QuickActionButton } from "@/components/QuickActionButton";
import { Users, Home, DollarSign, CheckCircle } from "lucide-react";

export default function Dashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-2">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back! Here's your overview.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <DashboardMetricCard
          title="Total Leads"
          value="248"
          icon={Users}
          trend={{ value: 12, isPositive: true }}
          onClick={() => console.log('Navigate to leads')}
        />
        <DashboardMetricCard
          title="Active Properties"
          value="127"
          icon={Home}
          trend={{ value: 8, isPositive: true }}
          onClick={() => console.log('Navigate to properties')}
        />
        <DashboardMetricCard
          title="Monthly Revenue"
          value="$84,500"
          icon={DollarSign}
          trend={{ value: 15, isPositive: true }}
        />
        <DashboardMetricCard
          title="Deals Closed"
          value="32"
          icon={CheckCircle}
          trend={{ value: 5, isPositive: false }}
        />
      </div>

      <PerformanceChart />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ActivityFeed />
        </div>
      </div>

      <QuickActionButton />
    </div>
  );
}
