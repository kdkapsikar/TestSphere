import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Edit, Trash2, FileText, AlertCircle, Clock, User, Flag, Code, CheckCircle, XCircle, AlertTriangle, Minus } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Sidebar from "@/components/sidebar";
import MobileHeader from "@/components/mobile-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { TestCase, TestScenario } from "@shared/schema";
import { insertTestCaseSchema } from "@shared/schema";

const formSchema = insertTestCaseSchema.extend({
  testSteps: z.string().optional(), // Handle as string in form, convert to JSON in submission
});

export default function TestCases() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTestCase, setEditingTestCase] = useState<TestCase | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      testCaseId: "",
      title: "",
      linkedScenarioId: "",
      preconditions: "",
      testSteps: "",
      testData: "",
      expectedResult: "",
      actualResult: "",
      executionStatus: "not_executed",
      priority: "medium",
      module: "",
      testType: "",
      postConditions: "",
      author: "",
      automationStatus: "manual",
      automationScriptId: "",
      comments: "",
    },
  });

  const { data: testCases, isLoading, isError, error } = useQuery<TestCase[]>({
    queryKey: ["/api/test-cases"],
  });

  const { data: scenarios } = useQuery<TestScenario[]>({
    queryKey: ["/api/test-scenarios"],
  });

  const createTestCaseMutation = useMutation({
    mutationFn: async (data: z.infer<typeof formSchema>) => {
      // Convert testSteps string to JSON array if provided
      const processedData = {
        ...data,
        testSteps: data.testSteps ? [{ step: 1, action: data.testSteps }] : null,
      };
      const response = await apiRequest("POST", "/api/test-cases", processedData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Test case created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/test-cases"] });
      form.reset();
      setIsModalOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create test case",
        variant: "destructive",
      });
    },
  });

  const updateTestCaseMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: z.infer<typeof formSchema> }) => {
      const processedData = {
        ...data,
        testSteps: data.testSteps ? [{ step: 1, action: data.testSteps }] : null,
      };
      const response = await apiRequest("PUT", `/api/test-cases/${id}`, processedData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Test Case Updated",
        description: "Test case has been updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/test-cases"] });
      form.reset();
      setEditingTestCase(null);
      setIsModalOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update test case",
        variant: "destructive",
      });
    },
  });

  const deleteTestCaseMutation = useMutation({
    mutationFn: async (testCaseId: string) => {
      await apiRequest("DELETE", `/api/test-cases/${testCaseId}`);
    },
    onSuccess: () => {
      toast({
        title: "Test Case Deleted",
        description: "Test case has been deleted",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/test-cases"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete test case",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    if (editingTestCase) {
      updateTestCaseMutation.mutate({ id: editingTestCase.id, data });
    } else {
      createTestCaseMutation.mutate(data);
    }
  };

  const handleEditTestCase = (testCase: TestCase) => {
    setEditingTestCase(testCase);
    form.reset({
      testCaseId: testCase.testCaseId || "",
      title: testCase.title || "",
      linkedScenarioId: testCase.linkedScenarioId || "",
      preconditions: testCase.preconditions || "",
      testSteps: Array.isArray(testCase.testSteps) && testCase.testSteps.length > 0 
        ? testCase.testSteps[0]?.action || "" 
        : "",
      testData: testCase.testData || "",
      expectedResult: testCase.expectedResult || "",
      actualResult: testCase.actualResult || "",
      executionStatus: testCase.executionStatus as "pass" | "fail" | "blocked" | "not_executed",
      priority: testCase.priority as "high" | "medium" | "low",
      module: testCase.module || "",
      testType: testCase.testType || "",
      postConditions: testCase.postConditions || "",
      author: testCase.author || "",
      automationStatus: testCase.automationStatus as "manual" | "automated" | "to_be_automated",
      automationScriptId: testCase.automationScriptId || "",
      comments: testCase.comments || "",
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setEditingTestCase(null);
    form.reset();
    setIsModalOpen(false);
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "high":
        return <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">High</Badge>;
      case "medium":
        return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">Medium</Badge>;
      case "low":
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Low</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200">Unknown</Badge>;
    }
  };

  const getExecutionStatusBadge = (status: string) => {
    switch (status) {
      case "pass":
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"><CheckCircle className="w-3 h-3 mr-1" />Pass</Badge>;
      case "fail":
        return <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"><XCircle className="w-3 h-3 mr-1" />Fail</Badge>;
      case "blocked":
        return <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200"><AlertTriangle className="w-3 h-3 mr-1" />Blocked</Badge>;
      case "not_executed":
        return <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"><Minus className="w-3 h-3 mr-1" />Not Executed</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200">Unknown</Badge>;
    }
  };

  const getAutomationStatusBadge = (status: string) => {
    switch (status) {
      case "automated":
        return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"><Code className="w-3 h-3 mr-1" />Automated</Badge>;
      case "manual":
        return <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">Manual</Badge>;
      case "to_be_automated":
        return <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200">To be Automated</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200">Unknown</Badge>;
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
              <h2 className="text-2xl font-bold text-foreground">Test Cases</h2>
              <p className="text-muted-foreground">
                Manage and organize your test cases ({testCases?.length || 0} total)
              </p>
            </div>
            <div className="mt-4 sm:mt-0">
              <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogTrigger asChild>
                  <Button data-testid="button-new-test-case">
                    <Plus className="w-4 h-4 mr-2" />
                    New Test Case
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>{editingTestCase ? "Edit Test Case" : "Create New Test Case"}</DialogTitle>
                  </DialogHeader>
                  
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                      {/* Core/Mandatory Fields */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-medium text-foreground border-b pb-2">Core Information</h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="testCaseId"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Test Case ID *</FormLabel>
                                <FormControl>
                                  <Input 
                                    placeholder="e.g., TC_LOGIN_01" 
                                    {...field}
                                    value={field.value || ""}
                                    data-testid="input-test-case-id"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="linkedScenarioId"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Linked Scenario</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value || ""}>
                                  <FormControl>
                                    <SelectTrigger data-testid="select-linked-scenario">
                                      <SelectValue placeholder="Select a scenario" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {scenarios?.map((scenario) => (
                                      <SelectItem key={scenario.id} value={scenario.id}>
                                        {scenario.scenarioId} - {scenario.title}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <FormField
                          control={form.control}
                          name="title"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Test Case Description/Title *</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="Clear summary of the specific condition being tested" 
                                  {...field}
                                  value={field.value || ""}
                                  data-testid="input-test-case-title"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="preconditions"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Preconditions</FormLabel>
                                <FormControl>
                                  <Textarea 
                                    placeholder="Requirements that must be met before execution"
                                    {...field}
                                    value={field.value || ""}
                                    data-testid="input-preconditions"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="postConditions"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Post Conditions</FormLabel>
                                <FormControl>
                                  <Textarea 
                                    placeholder="State of the system after the test runs"
                                    {...field}
                                    value={field.value || ""}
                                    data-testid="input-post-conditions"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <FormField
                          control={form.control}
                          name="testSteps"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Test Steps</FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder="Detailed, sequential actions to perform"
                                  {...field}
                                  value={field.value || ""}
                                  data-testid="input-test-steps"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="testData"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Test Data</FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder="Specific input values to use"
                                  {...field}
                                  value={field.value || ""}
                                  data-testid="input-test-data"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="expectedResult"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Expected Result</FormLabel>
                                <FormControl>
                                  <Textarea 
                                    placeholder="Specific, observable outcome that should happen"
                                    {...field}
                                    value={field.value || ""}
                                    data-testid="input-expected-result"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="actualResult"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Actual Result</FormLabel>
                                <FormControl>
                                  <Textarea 
                                    placeholder="To be filled during execution"
                                    {...field}
                                    value={field.value || ""}
                                    data-testid="input-actual-result"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <FormField
                          control={form.control}
                          name="executionStatus"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Execution Status</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger data-testid="select-execution-status">
                                    <SelectValue placeholder="Select execution status" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="not_executed">Not Executed</SelectItem>
                                  <SelectItem value="pass">Pass</SelectItem>
                                  <SelectItem value="fail">Fail</SelectItem>
                                  <SelectItem value="blocked">Blocked</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      {/* Additional Fields */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-medium text-foreground border-b pb-2">Additional Information</h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <FormField
                            control={form.control}
                            name="priority"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Priority</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                  <FormControl>
                                    <SelectTrigger data-testid="select-priority">
                                      <SelectValue placeholder="Select priority" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="high">High</SelectItem>
                                    <SelectItem value="medium">Medium</SelectItem>
                                    <SelectItem value="low">Low</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="module"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Module/Feature</FormLabel>
                                <FormControl>
                                  <Input 
                                    placeholder="Component under test"
                                    {...field}
                                    value={field.value || ""}
                                    data-testid="input-module"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="testType"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Test Type</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value || ""}>
                                  <FormControl>
                                    <SelectTrigger data-testid="select-test-type">
                                      <SelectValue placeholder="Select test type" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="positive">Positive</SelectItem>
                                    <SelectItem value="negative">Negative</SelectItem>
                                    <SelectItem value="boundary_value">Boundary Value</SelectItem>
                                    <SelectItem value="smoke">Smoke</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="author"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Author</FormLabel>
                                <FormControl>
                                  <Input 
                                    placeholder="Test case creator"
                                    {...field}
                                    value={field.value || ""}
                                    data-testid="input-author"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="automationStatus"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Automation Status</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                  <FormControl>
                                    <SelectTrigger data-testid="select-automation-status">
                                      <SelectValue placeholder="Select automation status" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="manual">Manual</SelectItem>
                                    <SelectItem value="automated">Automated</SelectItem>
                                    <SelectItem value="to_be_automated">To be Automated</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <FormField
                          control={form.control}
                          name="automationScriptId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Automation Script ID</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="Link to automated test script"
                                  {...field}
                                  value={field.value || ""}
                                  data-testid="input-automation-script-id"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="comments"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Comments/Notes</FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder="Additional information, notes, or reasons for failure"
                                  {...field}
                                  value={field.value || ""}
                                  data-testid="input-comments"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="flex justify-end space-x-4 pt-4">
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={handleCloseModal}
                          data-testid="button-cancel-test-case"
                        >
                          Cancel
                        </Button>
                        <Button 
                          type="submit" 
                          disabled={createTestCaseMutation.isPending || updateTestCaseMutation.isPending}
                          data-testid="button-save-test-case"
                        >
                          {editingTestCase ? "Update" : "Create"} Test Case
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>

        <div className="p-6 overflow-auto">
          {isError ? (
            <div className="text-center py-12">
              <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
              <h3 className="text-lg font-medium text-destructive mb-2">Failed to load test cases</h3>
              <p className="text-muted-foreground mb-6">
                {error instanceof Error ? error.message : "An error occurred while fetching test cases"}
              </p>
              <Button onClick={() => window.location.reload()} data-testid="button-retry-test-cases">
                Try Again
              </Button>
            </div>
          ) : isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-6">
                    <div className="h-4 bg-muted rounded w-3/4 mb-4"></div>
                    <div className="h-3 bg-muted rounded w-full mb-2"></div>
                    <div className="h-3 bg-muted rounded w-5/6 mb-4"></div>
                    <div className="flex justify-between items-center">
                      <div className="h-6 bg-muted rounded w-16"></div>
                      <div className="h-6 bg-muted rounded w-16"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : testCases && testCases.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-muted-foreground mb-2">No test cases yet</h3>
              <p className="text-muted-foreground mb-6">
                Create your first test case to start organizing your testing strategy.
              </p>
              <Button onClick={() => setIsModalOpen(true)} data-testid="button-create-first-test-case">
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Test Case
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {testCases?.map((testCase) => (
                <Card key={testCase.id} className="hover:shadow-lg transition-shadow" data-testid={`card-test-case-${testCase.id}`}>
                  <CardHeader className="pb-4">
                    <div className="flex justify-between items-start mb-2">
                      <CardTitle className="text-lg font-semibold text-foreground line-clamp-2">
                        {testCase.testCaseId && (
                          <span className="text-sm font-medium text-muted-foreground block mb-1">
                            {testCase.testCaseId}
                          </span>
                        )}
                        {testCase.title || testCase.name}
                      </CardTitle>
                      <div className="flex space-x-1">
                        {getPriorityBadge(testCase.priority)}
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-2 mb-3">
                      {getExecutionStatusBadge(testCase.executionStatus)}
                      {getAutomationStatusBadge(testCase.automationStatus)}
                    </div>
                    
                    {(testCase.description || testCase.expectedResult) && (
                      <p className="text-sm text-muted-foreground line-clamp-3 mb-3">
                        {testCase.description || testCase.expectedResult}
                      </p>
                    )}
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-3">
                      {testCase.module && (
                        <div className="flex items-center">
                          <Flag className="w-3 h-3 mr-1 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">{testCase.module}</span>
                        </div>
                      )}
                      
                      {testCase.testType && (
                        <div className="flex items-center">
                          <FileText className="w-3 h-3 mr-1 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground capitalize">
                            {testCase.testType.replace('_', ' ')}
                          </span>
                        </div>
                      )}
                      
                      {testCase.author && (
                        <div className="flex items-center">
                          <User className="w-3 h-3 mr-1 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">{testCase.author}</span>
                        </div>
                      )}
                      
                      {testCase.dateCreated && (
                        <div className="flex items-center">
                          <Clock className="w-3 h-3 mr-1 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">
                            {new Date(testCase.dateCreated).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex justify-between pt-4 border-t">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleEditTestCase(testCase)}
                        data-testid={`button-edit-test-case-${testCase.id}`}
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => deleteTestCaseMutation.mutate(testCase.id)}
                        disabled={deleteTestCaseMutation.isPending}
                        className="text-destructive hover:text-destructive/80"
                        data-testid={`button-delete-test-case-${testCase.id}`}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </Button>
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
