import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Edit, Trash2, Bug, AlertCircle, User, Calendar, Flag } from "lucide-react";
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
import type { Defect, TestCase, Requirement, TestScenario } from "@shared/schema";
import { insertDefectSchema } from "@shared/schema";
import { RichTextEditor } from "@/components/ui/rich-text-editor";

const formSchema = insertDefectSchema.extend({
  reportedBy: z.string().min(1, "Reporter name is required"),
});

export default function Defects() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDefect, setEditingDefect] = useState<Defect | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      stepsToReproduce: "",
      expectedResult: "",
      actualResult: "",
      severity: "medium",
      priority: "medium",
      status: "new",
      module: "",
      environment: "",
      reportedBy: "",
      assignedTo: "",
      linkedTestCaseId: "",
      linkedRequirementId: "",
      foundInVersion: "",
      fixedInVersion: "",
      resolutionType: "",
    },
  });

  const { data: defects, isLoading, isError, error } = useQuery<Defect[]>({
    queryKey: ["/api/defects"],
  });

  const { data: testCases } = useQuery<TestCase[]>({
    queryKey: ["/api/test-cases"],
    enabled: isModalOpen,
  });

  const { data: requirements } = useQuery<Requirement[]>({
    queryKey: ["/api/requirements"],
    enabled: isModalOpen,
  });

  const { data: testScenarios } = useQuery<TestScenario[]>({
    queryKey: ["/api/test-scenarios"],
    enabled: isModalOpen,
  });

  const createDefectMutation = useMutation({
    mutationFn: async (data: z.infer<typeof formSchema>) => {
      const defectData = {
        ...data,
        defectId: `BUG-${Date.now().toString().slice(-6)}`,
      };
      const response = await apiRequest("POST", "/api/defects", defectData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Defect created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/defects"] });
      form.reset();
      setIsModalOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create defect",
        variant: "destructive",
      });
    },
  });

  const updateDefectMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: z.infer<typeof formSchema> }) => {
      const response = await apiRequest("PUT", `/api/defects/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Defect updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/defects"] });
      form.reset();
      setEditingDefect(null);
      setIsModalOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update defect",
        variant: "destructive",
      });
    },
  });

  const deleteDefectMutation = useMutation({
    mutationFn: async (defectId: string) => {
      await apiRequest("DELETE", `/api/defects/${defectId}`);
    },
    onSuccess: () => {
      toast({
        title: "Defect Deleted",
        description: "Defect has been deleted",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/defects"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete defect",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    if (editingDefect) {
      updateDefectMutation.mutate({ id: editingDefect.id, data });
    } else {
      createDefectMutation.mutate(data);
    }
  };

  const handleEditDefect = (defect: Defect) => {
    setEditingDefect(defect);
    form.reset({
      title: defect.title,
      description: defect.description || "",
      stepsToReproduce: defect.stepsToReproduce || "",
      expectedResult: defect.expectedResult || "",
      actualResult: defect.actualResult || "",
      severity: defect.severity as "critical" | "high" | "medium" | "low",
      priority: defect.priority as "high" | "medium" | "low",
      status: defect.status as "new" | "assigned" | "in_progress" | "resolved" | "closed" | "reopened",
      module: defect.module || "",
      environment: defect.environment || "",
      reportedBy: defect.reportedBy,
      assignedTo: defect.assignedTo || "",
      linkedTestCaseId: defect.linkedTestCaseId || "",
      linkedRequirementId: defect.linkedRequirementId || "",
      foundInVersion: defect.foundInVersion || "",
      fixedInVersion: defect.fixedInVersion || "",
      resolutionType: defect.resolutionType || "",
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setEditingDefect(null);
    form.reset();
    setIsModalOpen(false);
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "critical":
        return <Badge className="bg-red-600 text-white">Critical</Badge>;
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "new":
        return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">New</Badge>;
      case "assigned":
        return <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">Assigned</Badge>;
      case "in_progress":
        return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">In Progress</Badge>;
      case "resolved":
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Resolved</Badge>;
      case "closed":
        return <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200">Closed</Badge>;
      case "reopened":
        return <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">Reopened</Badge>;
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
              <h2 className="text-2xl font-bold text-foreground">Defects</h2>
              <p className="text-muted-foreground">
                Track and manage defects and bugs ({defects?.length || 0} total)
              </p>
            </div>
            <div className="mt-4 sm:mt-0">
              <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogTrigger asChild>
                  <Button data-testid="button-new-defect">
                    <Plus className="w-4 h-4 mr-2" />
                    Report Defect
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>{editingDefect ? "Edit Defect" : "Report New Defect"}</DialogTitle>
                  </DialogHeader>
                  
                  <div className="max-h-[70vh] overflow-y-auto pr-2">
                    <Form {...form}>
                      <div className="space-y-4">
                        <FormField
                          control={form.control}
                          name="title"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Defect Title *</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="Brief description of the defect" 
                                  {...field} 
                                  data-testid="input-defect-title"
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
                                  rows={4} 
                                  placeholder="Detailed description of the defect..." 
                                  {...field}
                                  value={field.value || ""}
                                  data-testid="textarea-defect-description"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="space-y-2">
                          <label className="text-sm font-medium">Attachments</label>
                          <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                            <div className="text-muted-foreground">
                              <p className="text-sm">Drag and drop files here, or click to browse</p>
                              <p className="text-xs mt-1">Supported formats: PNG, JPG, PDF, TXT (Max 10MB)</p>
                            </div>
                            <Input
                              type="file"
                              multiple
                              accept=".png,.jpg,.jpeg,.pdf,.txt"
                              className="hidden"
                              data-testid="input-defect-attachments"
                            />
                            <Button type="button" variant="outline" className="mt-2" size="sm">
                              Choose Files
                            </Button>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="severity"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Severity *</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger data-testid="select-defect-severity">
                                      <SelectValue />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="critical">Critical</SelectItem>
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
                            name="priority"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Priority *</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger data-testid="select-defect-priority">
                                      <SelectValue />
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

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="module"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Module</FormLabel>
                                <FormControl>
                                  <Input 
                                    placeholder="e.g., Authentication, Payment" 
                                    {...field} 
                                    data-testid="input-defect-module"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="environment"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Environment</FormLabel>
                                <Select onValueChange={(value) => field.onChange(value === "none" ? "" : value)} value={field.value || "none"}>
                                  <FormControl>
                                    <SelectTrigger data-testid="select-defect-environment">
                                      <SelectValue placeholder="Select environment" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="none">None</SelectItem>
                                    <SelectItem value="development">Development</SelectItem>
                                    <SelectItem value="staging">Staging</SelectItem>
                                    <SelectItem value="production">Production</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <FormField
                          control={form.control}
                          name="stepsToReproduce"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Steps to Reproduce</FormLabel>
                              <FormControl>
                                <Textarea 
                                  rows={3} 
                                  placeholder="1. Step one&#10;2. Step two&#10;3. Step three..." 
                                  {...field} 
                                  data-testid="textarea-steps-to-reproduce"
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
                                    rows={2} 
                                    placeholder="What should have happened..." 
                                    {...field} 
                                    data-testid="textarea-expected-result"
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
                                    rows={2} 
                                    placeholder="What actually happened..." 
                                    {...field} 
                                    data-testid="textarea-actual-result"
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
                            name="reportedBy"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Reported By *</FormLabel>
                                <FormControl>
                                  <Input 
                                    placeholder="Your name or email" 
                                    {...field} 
                                    data-testid="input-reported-by"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="assignedTo"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Assigned To</FormLabel>
                                <FormControl>
                                  <Input 
                                    placeholder="Assignee name or email" 
                                    {...field} 
                                    data-testid="input-assigned-to"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <FormField
                            control={form.control}
                            name="linkedTestCaseId"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Linked Test Case</FormLabel>
                                <Select onValueChange={(value) => field.onChange(value === "none" ? "" : value)} value={field.value || "none"}>
                                  <FormControl>
                                    <SelectTrigger data-testid="select-linked-test-case">
                                      <SelectValue placeholder="Select test case" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="none">None</SelectItem>
                                    {testCases?.map((testCase) => (
                                      <SelectItem key={testCase.id} value={testCase.id}>
                                        {testCase.testCaseId || testCase.name || testCase.title}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="linkedScenarioId"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Linked Test Scenario</FormLabel>
                                <Select onValueChange={(value) => field.onChange(value === "none" ? "" : value)} value={field.value || "none"}>
                                  <FormControl>
                                    <SelectTrigger data-testid="select-linked-test-scenario">
                                      <SelectValue placeholder="Select test scenario" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="none">None</SelectItem>
                                    {testScenarios?.map((scenario) => (
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

                          <FormField
                            control={form.control}
                            name="linkedRequirementId"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Linked Requirement</FormLabel>
                                <Select onValueChange={(value) => field.onChange(value === "none" ? "" : value)} value={field.value || "none"}>
                                  <FormControl>
                                    <SelectTrigger data-testid="select-linked-requirement">
                                      <SelectValue placeholder="Select requirement" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="none">None</SelectItem>
                                    {requirements?.map((requirement) => (
                                      <SelectItem key={requirement.id} value={requirement.id}>
                                        {requirement.requirementId} - {requirement.title}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        {editingDefect && (
                          <>
                            <FormField
                              control={form.control}
                              name="status"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Status</FormLabel>
                                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                      <SelectTrigger data-testid="select-defect-status">
                                        <SelectValue />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="new">New</SelectItem>
                                      <SelectItem value="assigned">Assigned</SelectItem>
                                      <SelectItem value="in_progress">In Progress</SelectItem>
                                      <SelectItem value="resolved">Resolved</SelectItem>
                                      <SelectItem value="closed">Closed</SelectItem>
                                      <SelectItem value="reopened">Reopened</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <FormField
                                control={form.control}
                                name="foundInVersion"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Found in Version</FormLabel>
                                    <FormControl>
                                      <Input 
                                        placeholder="e.g., v1.2.3" 
                                        {...field} 
                                        data-testid="input-found-in-version"
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              <FormField
                                control={form.control}
                                name="fixedInVersion"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Fixed in Version</FormLabel>
                                    <FormControl>
                                      <Input 
                                        placeholder="e.g., v1.2.4" 
                                        {...field} 
                                        data-testid="input-fixed-in-version"
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>

                            <FormField
                              control={form.control}
                              name="resolutionType"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Resolution Type</FormLabel>
                                  <Select onValueChange={(value) => field.onChange(value === "none" ? "" : value)} value={field.value || "none"}>
                                    <FormControl>
                                      <SelectTrigger data-testid="select-resolution-type">
                                        <SelectValue placeholder="Select resolution type" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="none">None</SelectItem>
                                      <SelectItem value="fixed">Fixed</SelectItem>
                                      <SelectItem value="duplicate">Duplicate</SelectItem>
                                      <SelectItem value="not_a_bug">Not a Bug</SelectItem>
                                      <SelectItem value="wont_fix">Won't Fix</SelectItem>
                                      <SelectItem value="cannot_reproduce">Cannot Reproduce</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </>
                        )}
                      </div>
                    </Form>
                  </div>
                  
                  <div className="sticky bottom-0 bg-background border-t pt-4 flex justify-end space-x-3">
                    <Button type="button" variant="outline" onClick={handleCloseModal} data-testid="button-cancel">
                      Cancel
                    </Button>
                    <Button 
                      onClick={form.handleSubmit(onSubmit)}
                      disabled={createDefectMutation.isPending || updateDefectMutation.isPending}
                      data-testid="button-save-defect"
                    >
                      {editingDefect ? "Update" : "Report"} Defect
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>

        <div className="p-6 overflow-auto">
          {isError ? (
            <div className="text-center py-12">
              <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
              <h3 className="text-lg font-medium text-destructive mb-2">Failed to load defects</h3>
              <p className="text-muted-foreground mb-6">
                {error instanceof Error ? error.message : "An error occurred while fetching defects"}
              </p>
              <Button onClick={() => window.location.reload()} data-testid="button-retry-defects">
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
          ) : defects && defects.length === 0 ? (
            <div className="text-center py-12">
              <Bug className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-muted-foreground mb-2">No defects found</h3>
              <p className="text-muted-foreground mb-6">
                Great! No defects have been reported yet.
              </p>
              <Button onClick={() => setIsModalOpen(true)} data-testid="button-create-first-defect">
                <Plus className="w-4 h-4 mr-2" />
                Report First Defect
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {defects?.map((defect) => (
                <Card key={defect.id} className="hover:shadow-lg transition-shadow" data-testid={`card-defect-${defect.id}`}>
                  <CardHeader className="pb-4">
                    <div className="flex justify-between items-start mb-2">
                      <CardTitle className="text-lg font-semibold text-foreground line-clamp-2">
                        {defect.defectId && (
                          <span className="text-sm font-medium text-muted-foreground block mb-1">
                            {defect.defectId}
                          </span>
                        )}
                        {defect.title}
                      </CardTitle>
                      <div className="flex space-x-1">
                        {getSeverityBadge(defect.severity)}
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-2 mb-3">
                      {getStatusBadge(defect.status)}
                      <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200">
                        {defect.priority}
                      </Badge>
                    </div>
                    
                    {defect.description && (
                      <div className="text-sm text-muted-foreground line-clamp-3 mb-3">
                        <div 
                          className="prose prose-sm max-w-none text-muted-foreground [&>*]:text-muted-foreground"
                          dangerouslySetInnerHTML={{
                            __html: defect.description
                          }}
                        />
                      </div>
                    )}
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-3">
                      {defect.module && (
                        <div className="flex items-center">
                          <Flag className="w-3 h-3 mr-1 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">{defect.module}</span>
                        </div>
                      )}
                      
                      {defect.environment && (
                        <div className="flex items-center">
                          <AlertCircle className="w-3 h-3 mr-1 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground capitalize">{defect.environment}</span>
                        </div>
                      )}
                      
                      <div className="flex items-center">
                        <User className="w-3 h-3 mr-1 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">{defect.reportedBy}</span>
                      </div>
                      
                      <div className="flex items-center">
                        <Calendar className="w-3 h-3 mr-1 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">
                          {new Date(defect.dateReported).toLocaleDateString()}
                        </span>
                      </div>

                      {defect.assignedTo && (
                        <div className="flex items-center">
                          <User className="w-3 h-3 mr-1 text-blue-600" />
                          <span className="text-xs text-blue-600">Assigned: {defect.assignedTo}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex justify-between pt-4 border-t">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleEditDefect(defect)}
                        data-testid={`button-edit-defect-${defect.id}`}
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => deleteDefectMutation.mutate(defect.id)}
                        disabled={deleteDefectMutation.isPending}
                        className="text-destructive hover:text-destructive/80"
                        data-testid={`button-delete-defect-${defect.id}`}
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