import { useQuery } from "@tanstack/react-query";
import { Play, Square, Clock, CheckCircle, XCircle } from "lucide-react";
import Sidebar from "@/components/sidebar";
import MobileHeader from "@/components/mobile-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import type { TestRun } from "@shared/schema";

export default function TestRuns() {
  const { data: testRuns, isLoading } = useQuery<TestRun[]>({
    queryKey: ["/api/test-runs"],
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'passed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'aborted':
        return <Square className="w-4 h-4 text-gray-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'running':
        return <Badge className="bg-yellow-100 text-yellow-800">Running</Badge>;
      case 'passed':
        return <Badge className="bg-green-100 text-green-800">Passed</Badge>;
      case 'failed':
        return <Badge className="bg-red-100 text-red-800">Failed</Badge>;
      case 'aborted':
        return <Badge className="bg-gray-100 text-gray-800">Aborted</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">Unknown</Badge>;
    }
  };

  const formatDuration = (startTime: Date | null, endTime: Date | null, duration: number | null) => {
    if (duration) {
      return `${(duration / 1000).toFixed(1)}s`;
    }
    
    if (!startTime) return "-";
    
    if (!endTime) {
      const start = new Date(startTime);
      const now = new Date();
      const diffMs = now.getTime() - start.getTime();
      return `${(diffMs / 1000).toFixed(1)}s (running)`;
    }
    
    const start = new Date(startTime);
    const end = new Date(endTime);
    const diffMs = end.getTime() - start.getTime();
    return `${(diffMs / 1000).toFixed(1)}s`;
  };

  const formatDateTime = (date: Date | null) => {
    if (!date) return "-";
    return new Date(date).toLocaleString();
  };

  return (
    <div className="min-h-screen flex">
      <Sidebar />
      
      <main className="flex-1 flex flex-col">
        <MobileHeader />

        <div className="bg-card border-b border-border px-6 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-bold text-foreground">Test Runs</h2>
              <p className="text-muted-foreground">
                History of all test executions ({testRuns?.length || 0} runs)
              </p>
            </div>
          </div>
        </div>

        <div className="p-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Play className="w-5 h-5" />
                <span>Test Execution History</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center space-x-4">
                      <Skeleton className="h-4 w-8" />
                      <Skeleton className="h-4 w-48" />
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-4 w-32" />
                    </div>
                  ))}
                </div>
              ) : !testRuns || testRuns.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground" data-testid="no-test-runs">
                  <Play className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-medium mb-2">No test runs found</h3>
                  <p>Test runs will appear here once you start executing tests</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Status</TableHead>
                        <TableHead>Test Case ID</TableHead>
                        <TableHead>Started</TableHead>
                        <TableHead>Completed</TableHead>
                        <TableHead>Duration</TableHead>
                        <TableHead>Error Message</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {testRuns.map((run) => (
                        <TableRow key={run.id} data-testid="test-run-row">
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              {getStatusIcon(run.status)}
                              {getStatusBadge(run.status)}
                            </div>
                          </TableCell>
                          <TableCell className="font-mono text-sm" data-testid="test-run-case-id">
                            {run.testCaseId ? run.testCaseId.slice(0, 8) + '...' : 'N/A'}
                          </TableCell>
                          <TableCell className="text-sm" data-testid="test-run-start-time">
                            {formatDateTime(run.startTime)}
                          </TableCell>
                          <TableCell className="text-sm" data-testid="test-run-end-time">
                            {run.endTime ? formatDateTime(run.endTime) : "-"}
                          </TableCell>
                          <TableCell className="text-sm" data-testid="test-run-duration">
                            {formatDuration(run.startTime, run.endTime, run.duration)}
                          </TableCell>
                          <TableCell className="text-sm max-w-xs truncate" data-testid="test-run-error">
                            {run.errorMessage || "-"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
