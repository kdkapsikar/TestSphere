import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, Play, Square, Edit, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { TestCaseWithSuite } from "@shared/schema";

export default function TestCasesTable() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: testCases, isLoading } = useQuery<TestCaseWithSuite[]>({
    queryKey: ["/api/test-cases"],
  });

  const runTestMutation = useMutation({
    mutationFn: async (testCaseId: string) => {
      const response = await apiRequest("POST", `/api/test-cases/${testCaseId}/run`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Test Started",
        description: "Test execution has begun",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/test-cases"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to start test",
        variant: "destructive",
      });
    },
  });

  const stopTestMutation = useMutation({
    mutationFn: async (testCaseId: string) => {
      const response = await apiRequest("POST", `/api/test-cases/${testCaseId}/stop`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Test Stopped",
        description: "Test execution has been stopped",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/test-cases"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to stop test",
        variant: "destructive",
      });
    },
  });

  const deleteTestMutation = useMutation({
    mutationFn: async (testCaseId: string) => {
      await apiRequest("DELETE", `/api/test-cases/${testCaseId}`);
    },
    onSuccess: () => {
      toast({
        title: "Test Deleted",
        description: "Test case has been deleted",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/test-cases"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete test case",
        variant: "destructive",
      });
    },
  });

  const filteredTestCases = testCases?.filter((testCase) => {
    const matchesSearch = (testCase.name ?? '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         testCase.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         testCase.suite?.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || testCase.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'passed':
        return <Badge className="bg-green-100 text-green-800">Passed</Badge>;
      case 'failed':
        return <Badge className="bg-red-100 text-red-800">Failed</Badge>;
      case 'running':
        return <Badge className="bg-yellow-100 text-yellow-800">Running</Badge>;
      case 'pending':
      default:
        return <Badge className="bg-gray-100 text-gray-800">Pending</Badge>;
    }
  };

  const formatDuration = (duration: number | null) => {
    if (!duration) return "-";
    return `${(duration / 1000).toFixed(1)}s`;
  };

  const formatLastRun = (lastRun: Date | null, status: string) => {
    if (status === 'running') return "Running now";
    if (!lastRun) return "Never run";
    
    const date = new Date(lastRun);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return "Less than an hour ago";
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} days ago`;
  };

  return (
    <Card className="mt-8 bg-card rounded-lg border border-border">
      <CardHeader className="px-6 py-4 border-b border-border">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <h3 className="text-lg font-semibold text-foreground">Test Cases</h3>
          <div className="mt-4 sm:mt-0 flex items-center space-x-3">
            <div className="relative">
              <Input
                type="text"
                placeholder="Search test cases..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2"
                data-testid="input-search-test-cases"
              />
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-32" data-testid="select-status-filter">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="passed">Passed</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="running">Running</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        {isLoading ? (
          <div className="space-y-4 p-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-32" />
              </div>
            ))}
          </div>
        ) : !filteredTestCases || filteredTestCases.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground" data-testid="no-test-cases">
            {testCases?.length === 0 ? "No test cases found" : "No test cases match your filters"}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted">
                    <TableHead className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Test Case
                    </TableHead>
                    <TableHead className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Suite
                    </TableHead>
                    <TableHead className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Status
                    </TableHead>
                    <TableHead className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Last Run
                    </TableHead>
                    <TableHead className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Duration
                    </TableHead>
                    <TableHead className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="bg-card divide-y divide-border">
                  {filteredTestCases.map((testCase) => (
                    <TableRow key={testCase.id} className="hover:bg-accent/50" data-testid="test-case-row">
                      <TableCell className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-foreground" data-testid="test-case-name">
                          {testCase.name}
                        </div>
                        <div className="text-sm text-muted-foreground" data-testid="test-case-id">
                          {testCase.id.slice(0, 8)}...
                        </div>
                      </TableCell>
                      <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground" data-testid="test-case-suite">
                        {testCase.suite?.name || "No suite"}
                      </TableCell>
                      <TableCell className="px-6 py-4 whitespace-nowrap" data-testid="test-case-status">
                        {getStatusBadge(testCase.status)}
                      </TableCell>
                      <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground" data-testid="test-case-last-run">
                        {formatLastRun(testCase.lastRun, testCase.status)}
                      </TableCell>
                      <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground" data-testid="test-case-duration">
                        {formatDuration(testCase.duration)}
                      </TableCell>
                      <TableCell className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <Button variant="ghost" size="sm" data-testid="button-edit-test-case">
                          <Edit className="w-4 h-4" />
                        </Button>
                        {testCase.status === 'running' ? (
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => stopTestMutation.mutate(testCase.id)}
                            disabled={stopTestMutation.isPending}
                            data-testid="button-stop-test-case"
                          >
                            <Square className="w-4 h-4" />
                          </Button>
                        ) : (
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => runTestMutation.mutate(testCase.id)}
                            disabled={runTestMutation.isPending}
                            data-testid="button-run-test-case"
                          >
                            <Play className="w-4 h-4" />
                          </Button>
                        )}
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => deleteTestMutation.mutate(testCase.id)}
                          disabled={deleteTestMutation.isPending}
                          className="text-destructive hover:text-destructive/80"
                          data-testid="button-delete-test-case"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            
            <div className="px-6 py-4 bg-muted/30 border-t border-border">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground" data-testid="pagination-info">
                  Showing 1-{filteredTestCases.length} of {testCases?.length || 0} test cases
                </p>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm" disabled data-testid="button-previous-page">
                    Previous
                  </Button>
                  <Button variant="default" size="sm" data-testid="button-current-page">
                    1
                  </Button>
                  <Button variant="outline" size="sm" disabled data-testid="button-next-page">
                    Next
                  </Button>
                </div>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
