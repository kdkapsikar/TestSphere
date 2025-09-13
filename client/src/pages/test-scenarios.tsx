import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, TestTube2, Edit, Trash2, FileText, Link, User, AlertCircle } from "lucide-react";
import Sidebar from "@/components/sidebar";
import MobileHeader from "@/components/mobile-header";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { TestScenario } from "@shared/schema";
import { insertTestScenarioSchema } from "@shared/schema";

const formSchema = insertTestScenarioSchema;

export default function TestScenarios() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingScenario, setEditingScenario] = useState<TestScenario | null>(null);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      scenarioId: "",
      title: "",
      description: "",
      linkedRequirementId: "",
      module: "",
      testType: "",
      priority: "medium",
      author: "",
      reviewer: "",
      status: "draft",
    },
  });

  const { data: scenarios, isLoading, isError, error } = useQuery<TestScenario[]>({
    queryKey: ["/api/test-scenarios"],
  });

  const createScenarioMutation = useMutation({
    mutationFn: async (data: z.infer<typeof formSchema>) => {
      const response = await apiRequest("POST", "/api/test-scenarios", data);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/test-scenarios"] });
      setIsModalOpen(false);
      form.reset();
      setEditingScenario(null);
      toast({
        title: "Success",
        description: "Test scenario created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create test scenario",
        variant: "destructive",
      });
    },
  });

  const updateScenarioMutation = useMutation({
    mutationFn: async (data: z.infer<typeof formSchema>) => {
      if (!editingScenario) throw new Error("No scenario selected for editing");
      const response = await apiRequest("PUT", `/api/test-scenarios/${editingScenario.id}`, data);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/test-scenarios"] });
      setIsModalOpen(false);
      form.reset();
      setEditingScenario(null);
      toast({
        title: "Success",
        description: "Test scenario updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update test scenario",
        variant: "destructive",
      });
    },
  });

  const deleteScenarioMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/test-scenarios/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/test-scenarios"] });
      toast({
        title: "Success",
        description: "Test scenario deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete test scenario",
        variant: "destructive",
      });
    },
  });

  const handleEditScenario = (scenario: TestScenario) => {
    setEditingScenario(scenario);
    form.reset({
      scenarioId: scenario.scenarioId || "",
      title: scenario.title,
      description: scenario.description || "",
      linkedRequirementId: scenario.linkedRequirementId || "",
      module: scenario.module || "",
      testType: scenario.testType || "",
      priority: scenario.priority as "high" | "medium" | "low",
      author: scenario.author,
      reviewer: scenario.reviewer || "",
      status: scenario.status as "draft" | "reviewed" | "approved" | "deprecated",
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingScenario(null);
    form.reset();
  };

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    if (editingScenario) {
      updateScenarioMutation.mutate(data);
    } else {
      createScenarioMutation.mutate(data);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "bg-red-500 text-white";
      case "medium": return "bg-yellow-500 text-white";
      case "low": return "bg-green-500 text-white";
      default: return "bg-gray-500 text-white";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "draft": return "bg-gray-500 text-white";
      case "reviewed": return "bg-blue-500 text-white";
      case "approved": return "bg-green-500 text-white";
      case "deprecated": return "bg-red-500 text-white";
      default: return "bg-gray-500 text-white";
    }
  };

  return (
    <div className="min-h-screen flex bg-background">
      <Sidebar />
      
      <main className="flex-1 flex flex-col">
        <MobileHeader />
        
        <div className="bg-card border-b border-border px-6 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-bold text-foreground">Test Scenarios</h2>
              <p className="text-muted-foreground">Manage and organize your test scenarios to ensure comprehensive test coverage</p>
            </div>
            <div className="mt-4 sm:mt-0">
              <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => setEditingScenario(null)} data-testid="button-create-scenario">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Test Scenario
                  </Button>
                </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingScenario ? "Edit Test Scenario" : "Create New Test Scenario"}
                </DialogTitle>
              </DialogHeader>
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="scenarioId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Scenario ID</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="e.g., SC_LOGIN_01" 
                              {...field}
                              value={field.value || ""}
                              data-testid="input-scenario-id"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="priority"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Priority</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value} data-testid="select-scenario-priority">
                            <FormControl>
                              <SelectTrigger>
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
                  </div>

                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Title</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="e.g., User Login Validation" 
                            {...field} 
                            data-testid="input-scenario-title"
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
                            placeholder="Describe the test scenario..." 
                            {...field}
                            value={field.value || ""}
                            data-testid="textarea-scenario-description"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="module"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Module</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="e.g., Authentication, User Management" 
                              {...field}
                              value={field.value || ""}
                              data-testid="input-scenario-module"
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
                          <FormControl>
                            <Input 
                              placeholder="e.g., Functional, Integration, Regression" 
                              {...field}
                              value={field.value || ""}
                              data-testid="input-scenario-test-type"
                            />
                          </FormControl>
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
                              placeholder="e.g., John Doe" 
                              {...field} 
                              data-testid="input-scenario-author"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="reviewer"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Reviewer</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="e.g., Jane Smith" 
                              {...field}
                              value={field.value || ""}
                              data-testid="input-scenario-reviewer"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="linkedRequirementId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Linked Requirement ID</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="e.g., REQ-001" 
                              {...field}
                              value={field.value || ""}
                              data-testid="input-scenario-linked-requirement"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Status</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value} data-testid="select-scenario-status">
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select status" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="draft">Draft</SelectItem>
                              <SelectItem value="reviewed">Reviewed</SelectItem>
                              <SelectItem value="approved">Approved</SelectItem>
                              <SelectItem value="deprecated">Deprecated</SelectItem>
                            </SelectContent>
                          </Select>
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
                      data-testid="button-cancel-scenario"
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={createScenarioMutation.isPending || updateScenarioMutation.isPending}
                      data-testid="button-save-scenario"
                    >
                      {editingScenario ? "Update" : "Create"} Test Scenario
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
              <h3 className="text-lg font-medium text-destructive mb-2">Failed to load test scenarios</h3>
              <p className="text-muted-foreground mb-6">
                {error instanceof Error ? error.message : "An error occurred while fetching test scenarios"}
              </p>
              <Button onClick={() => window.location.reload()} data-testid="button-retry-scenarios">
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
          ) : scenarios && scenarios.length === 0 ? (
            <div className="text-center py-12">
              <TestTube2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-muted-foreground mb-2">No test scenarios yet</h3>
              <p className="text-muted-foreground mb-6">
                Create your first test scenario to start organizing your testing strategy.
              </p>
              <Button onClick={() => setIsModalOpen(true)} data-testid="button-create-first-scenario">
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Test Scenario
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {scenarios?.map((scenario) => (
                <Card key={scenario.id} className="hover:shadow-lg transition-shadow" data-testid={`card-scenario-${scenario.id}`}>
                  <CardHeader className="pb-4">
                    <div className="flex justify-between items-start mb-2">
                      {scenario.scenarioId && (
                        <Badge variant="outline" className="text-xs">
                          {scenario.scenarioId}
                        </Badge>
                      )}
                      <div className="flex gap-2">
                        <Badge className={getPriorityColor(scenario.priority)}>
                          {scenario.priority}
                        </Badge>
                        <Badge className={getStatusColor(scenario.status)}>
                          {scenario.status}
                        </Badge>
                      </div>
                    </div>
                    <CardTitle className="text-lg leading-tight" data-testid={`text-scenario-title-${scenario.id}`}>
                      {scenario.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-3">
                      {scenario.description && (
                        <p className="text-sm text-muted-foreground line-clamp-3" data-testid={`text-scenario-description-${scenario.id}`}>
                          {scenario.description}
                        </p>
                      )}
                      
                      <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                        {scenario.module && (
                          <span className="flex items-center">
                            <FileText className="w-3 h-3 mr-1" />
                            {scenario.module}
                          </span>
                        )}
                        {scenario.testType && (
                          <span className="flex items-center">
                            <TestTube2 className="w-3 h-3 mr-1" />
                            {scenario.testType}
                          </span>
                        )}
                        {scenario.linkedRequirementId && (
                          <span className="flex items-center">
                            <Link className="w-3 h-3 mr-1" />
                            {scenario.linkedRequirementId}
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center justify-between pt-2 text-xs text-muted-foreground border-t">
                        <span className="flex items-center">
                          <User className="w-3 h-3 mr-1" />
                          {scenario.author}
                        </span>
                        {scenario.reviewer && (
                          <span className="flex items-center">
                            <User className="w-3 h-3 mr-1" />
                            Rev: {scenario.reviewer}
                          </span>
                        )}
                      </div>
                      
                      <div className="flex justify-between pt-4 border-t">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleEditScenario(scenario)}
                          data-testid={`button-edit-scenario-${scenario.id}`}
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => deleteScenarioMutation.mutate(scenario.id)}
                          disabled={deleteScenarioMutation.isPending}
                          className="text-destructive hover:text-destructive/80"
                          data-testid={`button-delete-scenario-${scenario.id}`}
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