import { DashboardMetricCard } from '../DashboardMetricCard';
import { Users, Home, DollarSign, CheckCircle } from 'lucide-react';

export default function DashboardMetricCardExample() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 p-6">
      <DashboardMetricCard
        title="Total Leads"
        value="248"
        icon={Users}
        trend={{ value: 12, isPositive: true }}
      />
      <DashboardMetricCard
        title="Active Properties"
        value="127"
        icon={Home}
        trend={{ value: 8, isPositive: true }}
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
  );
}
