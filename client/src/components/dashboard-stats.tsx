import { useQuery } from "@tanstack/react-query";
import { FileText, CheckCircle, XCircle, Clock, ClipboardList, TestTube2, Bug } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface TestCaseStats {
  totalTests: number;
  passedTests: number;
  failedTests: number;
  runningTests: number;
  pendingTests: number;
}

interface RequirementStats {
  totalRequirements: number;
  highPriority: number;
  mediumPriority: number;
  lowPriority: number;
}

interface TestScenarioStats {
  totalScenarios: number;
  draftScenarios: number;
  reviewedScenarios: number;
  approvedScenarios: number;
}

interface DefectStats {
  totalDefects: number;
  newDefects: number;
  assignedDefects: number;
  resolvedDefects: number;
}

export default function DashboardStats() {
  const { data: testStats, isLoading: testStatsLoading } = useQuery<TestCaseStats>({
    queryKey: ["/api/dashboard/stats"],
  });

  const { data: requirementStats, isLoading: requirementStatsLoading } = useQuery<RequirementStats>({
    queryKey: ["/api/requirements/stats"],
  });

  const { data: scenarioStats, isLoading: scenarioStatsLoading } = useQuery<TestScenarioStats>({
    queryKey: ["/api/test-scenarios/stats"],
  });

  const { data: defectStats, isLoading: defectStatsLoading } = useQuery<DefectStats>({
    queryKey: ["/api/defects/stats"],
  });

  const isLoading = testStatsLoading || requirementStatsLoading || scenarioStatsLoading || defectStatsLoading;

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[...Array(8)].map((_, i) => (
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

  if (!testStats && !requirementStats && !scenarioStats && !defectStats) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-muted-foreground">
              Failed to load dashboard statistics
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const testSuccessRate = testStats && testStats.totalTests > 0 ? Math.round((testStats.passedTests / testStats.totalTests) * 100) : 0;
  const testActiveRate = testStats && testStats.totalTests > 0 ? ((testStats.runningTests / testStats.totalTests) * 100).toFixed(1) : "0";

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {/* Requirements Stats */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Requirements</p>
              <p className="text-2xl font-bold text-foreground" data-testid="stat-total-requirements">
                {requirementStats?.totalRequirements || 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <ClipboardList className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-blue-600 font-medium">{requirementStats?.highPriority || 0} high priority</span>
          </div>
        </CardContent>
      </Card>

      {/* Test Scenarios Stats */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Test Scenarios</p>
              <p className="text-2xl font-bold text-foreground" data-testid="stat-total-scenarios">
                {scenarioStats?.totalScenarios || 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <TestTube2 className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-green-600 font-medium">{scenarioStats?.approvedScenarios || 0} approved</span>
          </div>
        </CardContent>
      </Card>

      {/* Test Cases Stats */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Test Cases</p>
              <p className="text-2xl font-bold text-foreground" data-testid="stat-total-tests">
                {testStats?.totalTests || 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
              <FileText className="w-6 h-6 text-primary" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-green-600 font-medium">{testSuccessRate}%</span>
            <span className="text-muted-foreground ml-2">success rate</span>
          </div>
        </CardContent>
      </Card>

      {/* Defects Stats */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Open Defects</p>
              <p className="text-2xl font-bold text-red-600" data-testid="stat-total-defects">
                {defectStats?.totalDefects || 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <Bug className="w-6 h-6 text-red-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-red-600 font-medium">{defectStats?.newDefects || 0} new</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
