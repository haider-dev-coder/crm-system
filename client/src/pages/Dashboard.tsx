import { DashboardMetricCard } from "@/components/DashboardMetricCard";
import { ActivityFeed } from "@/components/ActivityFeed";
import { PerformanceChart } from "@/components/PerformanceChart";
import { QuickActionButton } from "@/components/QuickActionButton";
import { Users, Home, DollarSign, CheckCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface AnalyticsData {
  totalLeads: number;
  activeProperties: number;
  dealsClosed: number;
  monthlyRevenue: number;
}

export default function Dashboard() {
  const { data: analytics, isLoading } = useQuery<AnalyticsData>({ 
    queryKey: ["/api/analytics/dashboard"] 
  });

  if (isLoading) {
    return <div className="p-6">Loading...</div>;
  }

  const formatCurrency = (amount: number) => {
    if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(1)}K`;
    }
    return `$${amount.toFixed(0)}`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-2">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back! Here's your overview.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <DashboardMetricCard
          title="Total Leads"
          value={String(analytics?.totalLeads || 0)}
          icon={Users}
          trend={{ value: 12, isPositive: true }}
          onClick={() => console.log('Navigate to leads')}
          data-testid="metric-total-leads"
        />
        <DashboardMetricCard
          title="Active Properties"
          value={String(analytics?.activeProperties || 0)}
          icon={Home}
          trend={{ value: 8, isPositive: true }}
          onClick={() => console.log('Navigate to properties')}
          data-testid="metric-active-properties"
        />
        <DashboardMetricCard
          title="Monthly Revenue"
          value={formatCurrency(analytics?.monthlyRevenue || 0)}
          icon={DollarSign}
          trend={{ value: 15, isPositive: true }}
          data-testid="metric-revenue"
        />
        <DashboardMetricCard
          title="Deals Closed"
          value={String(analytics?.dealsClosed || 0)}
          icon={CheckCircle}
          trend={{ value: 5, isPositive: false }}
          data-testid="metric-deals-closed"
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
