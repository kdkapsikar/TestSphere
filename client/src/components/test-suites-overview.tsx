import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import type { TestSuiteWithStats } from "@shared/schema";

export default function TestSuitesOverview() {
  const { data: suites, isLoading } = useQuery<TestSuiteWithStats[]>({
    queryKey: ["/api/test-suites/with-stats"],
  });

  const getStatusBadge = (suite: TestSuiteWithStats) => {
    if (suite.runningTests > 0) {
      return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Running</Badge>;
    } else if (suite.totalTests > 0) {
      return <Badge variant="secondary" className="bg-green-100 text-green-800">Active</Badge>;
    } else {
      return <Badge variant="secondary" className="bg-gray-100 text-gray-800">Pending</Badge>;
    }
  };

  const formatLastRun = (suite: TestSuiteWithStats) => {
    if (suite.runningTests > 0) {
      return "Currently running";
    } else if (suite.totalTests > 0) {
      return "2 hours ago"; // Mock data for demo
    } else {
      return "Never run";
    }
  };

  return (
    <Card className="bg-card rounded-lg border border-border">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-foreground">
            Test Suites
          </CardTitle>
          <Button variant="ghost" size="sm" className="text-sm text-primary hover:text-primary/80">
            Manage Suites
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="p-4 bg-secondary/30 rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-5 w-16" />
                </div>
                <div className="flex items-center justify-between">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-28" />
                </div>
                <Skeleton className="h-2 w-full" />
                <Skeleton className="h-3 w-20" />
              </div>
            ))}
          </div>
        ) : !suites || suites.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground" data-testid="no-suites">
            No test suites found
          </div>
        ) : (
          <div className="space-y-4">
            {suites.map((suite) => (
              <div key={suite.id} className="p-4 bg-secondary/30 rounded-lg" data-testid="suite-card">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-foreground" data-testid="suite-name">
                    {suite.name}
                  </h4>
                  {getStatusBadge(suite)}
                </div>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span data-testid="suite-test-count">{suite.totalTests} test cases</span>
                  <span data-testid="suite-last-run">{formatLastRun(suite)}</span>
                </div>
                <div className="mt-2">
                  <Progress value={suite.passRate} className="w-full h-2" />
                </div>
                <div className="mt-1 text-xs text-muted-foreground" data-testid="suite-pass-rate">
                  {suite.passRate}% pass rate
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
