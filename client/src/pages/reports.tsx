import { useQuery } from "@tanstack/react-query";
import { BarChart3, Download, TrendingUp, Calendar } from "lucide-react";
import Sidebar from "@/components/sidebar";
import MobileHeader from "@/components/mobile-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { TestSuiteWithStats } from "@shared/schema";

interface DashboardStats {
  totalTests: number;
  passedTests: number;
  failedTests: number;
  runningTests: number;
  pendingTests: number;
}

export default function Reports() {
  const { data: stats } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
  });

  const { data: testSuites } = useQuery<TestSuiteWithStats[]>({
    queryKey: ["/api/test-suites/with-stats"],
  });

  const successRate = stats && stats.totalTests > 0 ? Math.round((stats.passedTests / stats.totalTests) * 100) : 0;
  const completedTests = stats ? stats.passedTests + stats.failedTests : 0;
  const completionRate = stats && stats.totalTests > 0 ? Math.round((completedTests / stats.totalTests) * 100) : 0;

  return (
    <div className="min-h-screen flex">
      <Sidebar />
      
      <main className="flex-1 flex flex-col">
        <MobileHeader />

        <div className="bg-card border-b border-border px-6 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-bold text-foreground">Reports</h2>
              <p className="text-muted-foreground">
                Analytics and insights for your test execution
              </p>
            </div>
            <div className="mt-4 sm:mt-0 flex space-x-3">
              <Select defaultValue="last-30-days">
                <SelectTrigger className="w-40" data-testid="select-time-range">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="last-7-days">Last 7 days</SelectItem>
                  <SelectItem value="last-30-days">Last 30 days</SelectItem>
                  <SelectItem value="last-90-days">Last 90 days</SelectItem>
                  <SelectItem value="all-time">All time</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="secondary" data-testid="button-export-report">
                <Download className="w-4 h-4 mr-2" />
                Export Report
              </Button>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Success Rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600" data-testid="metric-success-rate">
                  {successRate}%
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  {stats?.passedTests || 0} of {stats?.totalTests || 0} tests passed
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Completion Rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600" data-testid="metric-completion-rate">
                  {completionRate}%
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  {completedTests} of {stats?.totalTests || 0} tests completed
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
                  <Calendar className="w-4 h-4 mr-2" />
                  Active Tests
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-yellow-600" data-testid="metric-active-tests">
                  {stats?.runningTests || 0}
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Currently running tests
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Test Suite Performance */}
          <Card>
            <CardHeader>
              <CardTitle>Test Suite Performance</CardTitle>
            </CardHeader>
            <CardContent>
              {!testSuites || testSuites.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No test suites available for reporting
                </div>
              ) : (
                <div className="space-y-4">
                  {testSuites.map((suite) => (
                    <div key={suite.id} className="flex items-center justify-between p-4 border rounded-lg" data-testid="suite-performance">
                      <div className="flex-1">
                        <h4 className="font-medium text-foreground" data-testid="suite-name">{suite.name}</h4>
                        <div className="flex items-center space-x-4 mt-2 text-sm text-muted-foreground">
                          <span data-testid="suite-total-tests">{suite.totalTests} tests</span>
                          <span className="text-green-600" data-testid="suite-passed-tests">{suite.passedTests} passed</span>
                          <span className="text-red-600" data-testid="suite-failed-tests">{suite.failedTests} failed</span>
                          {suite.runningTests > 0 && (
                            <span className="text-yellow-600" data-testid="suite-running-tests">{suite.runningTests} running</span>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-semibold" data-testid="suite-pass-rate">
                          {suite.passRate}%
                        </div>
                        <div className="text-sm text-muted-foreground">pass rate</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Test Execution Trends */}
          <Card>
            <CardHeader>
              <CardTitle>Test Execution Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <BarChart3 className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">Charts Coming Soon</h3>
                <p>Advanced analytics and trend charts will be available in a future update</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
