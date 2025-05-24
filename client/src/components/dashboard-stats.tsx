import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, Clock, ListTodo, AlertTriangle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface DashboardStats {
  total: number;
  completed: number;
  pending: number;
  overdue: number;
}

export function DashboardStats() {
  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ['/api/dashboard/stats'],
  });

  if (isLoading) {
    return <DashboardStatsLoading />;
  }

  const completionRate = stats && stats.total > 0
    ? Math.round((stats.completed / stats.total) * 100)
    : 0;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="Total Tasks"
        value={stats?.total || 0}
        description="All tasks"
        icon={<ListTodo className="h-6 w-6 text-blue-500" />}
        color="blue"
      />
      <StatCard
        title="Completed"
        value={stats?.completed || 0}
        description={`${completionRate}% completion rate`}
        icon={<CheckCircle className="h-6 w-6 text-green-500" />}
        color="green"
        progress={completionRate}
      />
      <StatCard
        title="Pending"
        value={stats?.pending || 0}
        description="Tasks in progress"
        icon={<Clock className="h-6 w-6 text-yellow-500" />}
        color="yellow"
      />
      <StatCard
        title="Overdue"
        value={stats?.overdue || 0}
        description="Past due date"
        icon={<AlertTriangle className="h-6 w-6 text-red-500" />}
        color="red"
      />
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: number;
  description: string;
  icon: React.ReactNode;
  color: "blue" | "green" | "yellow" | "red";
  progress?: number;
}

function StatCard({ title, value, description, icon, color, progress }: StatCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
        {progress !== undefined && (
          <Progress
            value={progress}
            className="h-1 mt-3"
          />
        )}
      </CardContent>
    </Card>
  );
}

function DashboardStatsLoading() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {[...Array(4)].map((_, i) => (
        <Card key={i}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-6 w-6 rounded-full" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-10 mb-2" />
            <Skeleton className="h-4 w-32" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
