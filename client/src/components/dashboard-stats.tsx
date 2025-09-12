import { useQuery } from "@tanstack/react-query";
import { FileText, CheckCircle, XCircle, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface DashboardStats {
  totalTests: number;
  passedTests: number;
  failedTests: number;
  runningTests: number;
  pendingTests: number;
}

export default function DashboardStats() {
  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-8 w-16" />
                </div>
                <Skeleton className="h-12 w-12 rounded-lg" />
              </div>
              <div className="mt-4 flex items-center space-x-2">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-24" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-muted-foreground">
              Failed to load statistics
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const successRate = stats.totalTests > 0 ? Math.round((stats.passedTests / stats.totalTests) * 100) : 0;
  const activeRate = stats.totalTests > 0 ? ((stats.runningTests / stats.totalTests) * 100).toFixed(1) : "0";

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Test Cases</p>
              <p className="text-2xl font-bold text-foreground" data-testid="stat-total-tests">
                {stats.totalTests}
              </p>
            </div>
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
              <FileText className="w-6 h-6 text-primary" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-green-600 font-medium">+12%</span>
            <span className="text-muted-foreground ml-2">from last month</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Passed Tests</p>
              <p className="text-2xl font-bold text-green-600" data-testid="stat-passed-tests">
                {stats.passedTests}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-green-600 font-medium">{successRate}%</span>
            <span className="text-muted-foreground ml-2">success rate</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Failed Tests</p>
              <p className="text-2xl font-bold text-red-600" data-testid="stat-failed-tests">
                {stats.failedTests}
              </p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <XCircle className="w-6 h-6 text-red-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-red-600 font-medium">-3%</span>
            <span className="text-muted-foreground ml-2">from last month</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Running Tests</p>
              <p className="text-2xl font-bold text-yellow-600" data-testid="stat-running-tests">
                {stats.runningTests}
              </p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-yellow-600 font-medium">{activeRate}%</span>
            <span className="text-muted-foreground ml-2">currently active</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
