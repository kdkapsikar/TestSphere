import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Edit, Trash2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Sidebar from "@/components/sidebar";
import MobileHeader from "@/components/mobile-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { TestSuiteWithStats } from "@shared/schema";

const formSchema = z.object({
  name: z.string().min(1, "Suite name is required"),
  description: z.string().optional(),
  status: z.enum(["active", "inactive", "archived"]).default("active"),
});

export default function TestSuites() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSuite, setEditingSuite] = useState<TestSuiteWithStats | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      status: "active",
    },
  });

  const { data: testSuites, isLoading } = useQuery<TestSuiteWithStats[]>({
    queryKey: ["/api/test-suites/with-stats"],
  });

  const createSuiteMutation = useMutation({
    mutationFn: async (data: z.infer<typeof formSchema>) => {
      const response = await apiRequest("POST", "/api/test-suites", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Test suite created successfully",
      });
      // Invalidate both test suite queries to ensure UI updates
      queryClient.invalidateQueries({ queryKey: ["/api/test-suites"] });
      queryClient.invalidateQueries({ queryKey: ["/api/test-suites/with-stats"] });
      form.reset();
      setIsModalOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create test suite",
        variant: "destructive",
      });
    },
  });

  const updateSuiteMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: z.infer<typeof formSchema> }) => {
      const response = await apiRequest("PUT", `/api/test-suites/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Test suite updated successfully",
      });
      // Invalidate both test suite queries to ensure UI updates
      queryClient.invalidateQueries({ queryKey: ["/api/test-suites"] });
      queryClient.invalidateQueries({ queryKey: ["/api/test-suites/with-stats"] });
      form.reset();
      setEditingSuite(null);
      setIsModalOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update test suite",
        variant: "destructive",
      });
    },
  });

  const deleteSuiteMutation = useMutation({
    mutationFn: async (suiteId: string) => {
      await apiRequest("DELETE", `/api/test-suites/${suiteId}`);
    },
    onSuccess: () => {
      toast({
        title: "Suite Deleted",
        description: "Test suite has been deleted",
      });
      // Invalidate both test suite queries to ensure UI updates
      queryClient.invalidateQueries({ queryKey: ["/api/test-suites"] });
      queryClient.invalidateQueries({ queryKey: ["/api/test-suites/with-stats"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete test suite",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    if (editingSuite) {
      updateSuiteMutation.mutate({ id: editingSuite.id, data });
    } else {
      createSuiteMutation.mutate(data);
    }
  };

  const handleEditSuite = (suite: TestSuiteWithStats) => {
    setEditingSuite(suite);
    form.reset({
      name: suite.name,
      description: suite.description || "",
      status: suite.status as "active" | "inactive" | "archived",
    });
    setIsModalOpen(true);
  };

  const handleCancelEdit = () => {
    setEditingSuite(null);
    form.reset();
    setIsModalOpen(false);
  };

  const getStatusBadge = (suite: TestSuiteWithStats) => {
    if (suite.runningTests > 0) {
      return <Badge className="bg-yellow-100 text-yellow-800">Running</Badge>;
    } else if (suite.totalTests > 0) {
      return <Badge className="bg-green-100 text-green-800">Active</Badge>;
    } else {
      return <Badge className="bg-gray-100 text-gray-800">Inactive</Badge>;
    }
  };

  return (
    <div className="min-h-screen flex">
      <Sidebar />
      
      <main className="flex-1 flex flex-col">
        <MobileHeader />

        <div className="bg-card border-b border-border px-6 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-bold text-foreground">Test Suites</h2>
              <p className="text-muted-foreground">
                Organize your tests into logical groups ({testSuites?.length || 0} suites)
              </p>
            </div>
            <div className="mt-4 sm:mt-0">
              <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogTrigger asChild>
                  <Button data-testid="button-new-test-suite">
                    <Plus className="w-4 h-4 mr-2" />
                    New Test Suite
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>{editingSuite ? "Edit Test Suite" : "Create New Test Suite"}</DialogTitle>
                  </DialogHeader>
                  
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Suite Name</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Enter suite name" 
                                {...field} 
                                data-testid="input-suite-name"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                              <Textarea 
                                rows={3} 
                                placeholder="Describe this test suite..." 
                                {...field} 
                                data-testid="textarea-suite-description"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="flex justify-end space-x-3 pt-4">
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={handleCancelEdit}
                          data-testid="button-cancel"
                        >
                          Cancel
                        </Button>
                        <Button 
                          type="submit" 
                          disabled={createSuiteMutation.isPending || updateSuiteMutation.isPending}
                          data-testid={editingSuite ? "button-update-suite" : "button-create-suite"}
                        >
                          {editingSuite ? (
                            updateSuiteMutation.isPending ? "Updating..." : "Update Suite"
                          ) : (
                            createSuiteMutation.isPending ? "Creating..." : "Create Suite"
                          )}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>

        <div className="p-6">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-6">
                    <div className="h-4 bg-muted rounded w-3/4 mb-4"></div>
                    <div className="h-3 bg-muted rounded w-1/2 mb-2"></div>
                    <div className="h-3 bg-muted rounded w-2/3 mb-4"></div>
                    <div className="h-2 bg-muted rounded w-full mb-2"></div>
                    <div className="h-3 bg-muted rounded w-1/4"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : !testSuites || testSuites.length === 0 ? (
            <div className="text-center py-12">
              <h3 className="text-lg font-medium text-muted-foreground mb-2">No test suites found</h3>
              <p className="text-muted-foreground mb-6">Get started by creating your first test suite</p>
              <Button onClick={() => setIsModalOpen(true)} data-testid="button-create-first-suite">
                <Plus className="w-4 h-4 mr-2" />
                Create Test Suite
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {testSuites.map((suite) => (
                <Card key={suite.id} className="hover:shadow-md transition-shadow" data-testid="suite-card">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg" data-testid="suite-name">{suite.name}</CardTitle>
                      {getStatusBadge(suite)}
                    </div>
                    {suite.description && (
                      <p className="text-sm text-muted-foreground" data-testid="suite-description">
                        {suite.description}
                      </p>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Test Cases</span>
                        <span className="font-medium" data-testid="suite-test-count">{suite.totalTests}</span>
                      </div>
                      
                      {suite.totalTests > 0 && (
                        <>
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-green-600">Passed: {suite.passedTests}</span>
                              <span className="text-red-600">Failed: {suite.failedTests}</span>
                            </div>
                            <Progress value={suite.passRate} className="h-2" />
                            <div className="text-center text-sm text-muted-foreground" data-testid="suite-pass-rate">
                              {suite.passRate}% pass rate
                            </div>
                          </div>
                        </>
                      )}
                      
                      <div className="flex justify-between pt-4 border-t">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleEditSuite(suite)}
                          data-testid="button-edit-suite"
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => deleteSuiteMutation.mutate(suite.id)}
                          disabled={deleteSuiteMutation.isPending}
                          className="text-destructive hover:text-destructive/80"
                          data-testid="button-delete-suite"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
