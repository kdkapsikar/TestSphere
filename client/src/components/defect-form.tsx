import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { X, Bug } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { TestCase, Requirement } from "@shared/schema";

const formSchema = z.object({
  title: z.string().min(1, "Defect title is required"),
  description: z.string().optional(),
  stepsToReproduce: z.string().optional(),
  expectedResult: z.string().optional(),
  actualResult: z.string().optional(),
  severity: z.enum(["critical", "high", "medium", "low"]),
  priority: z.enum(["high", "medium", "low"]),
  module: z.string().optional(),
  environment: z.string().optional(),
  reportedBy: z.string().min(1, "Reporter name is required"),
  linkedTestCaseId: z.string().optional(),
  linkedRequirementId: z.string().optional(),
});

interface DefectFormProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function DefectForm({ isOpen, onClose }: DefectFormProps) {
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
      module: "",
      environment: "",
      reportedBy: "",
      linkedTestCaseId: "",
      linkedRequirementId: "",
    },
  });

  const { data: testCases } = useQuery<TestCase[]>({
    queryKey: ["/api/test-cases"],
    enabled: isOpen,
  });

  const { data: requirements } = useQuery<Requirement[]>({
    queryKey: ["/api/requirements"],
    enabled: isOpen,
  });

  const createDefectMutation = useMutation({
    mutationFn: async (data: z.infer<typeof formSchema>) => {
      const defectData = {
        ...data,
        defectId: `BUG-${Date.now().toString().slice(-6)}`,
        status: "new",
      };
      const response = await apiRequest("POST", "/api/defects", defectData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Defect reported successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/defects"] });
      queryClient.invalidateQueries({ queryKey: ["/api/defects/stats"] });
      form.reset();
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create defect",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    createDefectMutation.mutate(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="defect-form-modal">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <Bug className="w-5 h-5 mr-2 text-red-600" />
              Report New Defect
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} data-testid="modal-close-button">
              <X className="w-4 h-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                      rows={3} 
                      placeholder="Detailed description of the defect..." 
                      {...field} 
                      data-testid="textarea-defect-description"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-defect-environment">
                          <SelectValue placeholder="Select environment" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="linkedTestCaseId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Linked Test Case</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-linked-test-case">
                          <SelectValue placeholder="Select test case" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
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
                name="linkedRequirementId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Linked Requirement</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-linked-requirement">
                          <SelectValue placeholder="Select requirement" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
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
            
            <div className="flex justify-end space-x-3 pt-4">
              <Button type="button" variant="outline" onClick={onClose} data-testid="button-cancel">
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={createDefectMutation.isPending}
                data-testid="button-create-defect"
              >
                {createDefectMutation.isPending ? "Reporting..." : "Report Defect"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}