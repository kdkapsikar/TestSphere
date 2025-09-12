import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { X, Plus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { TestSuite } from "@shared/schema";

const formSchema = z.object({
  name: z.string().min(1, "Test case name is required"),
  description: z.string().optional(),
  suiteId: z.string().min(1, "Test suite is required"),
  priority: z.enum(["high", "medium", "low"]),
});

interface TestCaseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function TestCaseModal({ isOpen, onClose }: TestCaseModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      suiteId: "",
      priority: "medium",
    },
  });

  const { data: testSuites, isLoading: suitesLoading } = useQuery<TestSuite[]>({
    queryKey: ["/api/test-suites"],
    enabled: isOpen,
  });

  const createTestCaseMutation = useMutation({
    mutationFn: async (data: z.infer<typeof formSchema>) => {
      const response = await apiRequest("POST", "/api/test-cases", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Test case created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/test-cases"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      form.reset();
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create test case",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    createTestCaseMutation.mutate(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md" data-testid="test-case-modal">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            Create New Test Case
            <Button variant="ghost" size="icon" onClick={onClose} data-testid="modal-close-button">
              <X className="w-4 h-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Test Case Name</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Enter test case name" 
                      {...field} 
                      data-testid="input-test-case-name"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="suiteId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Test Suite</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-test-suite">
                        <SelectValue placeholder="Select a test suite" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {suitesLoading ? (
                        <SelectItem value="loading" disabled>Loading...</SelectItem>
                      ) : (
                        testSuites?.map((suite) => (
                          <SelectItem key={suite.id} value={suite.id}>
                            {suite.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
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
                      placeholder="Describe what this test validates..." 
                      {...field} 
                      data-testid="textarea-description"
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
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-priority">
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
            
            <div className="flex justify-end space-x-3 pt-4">
              <Button type="button" variant="outline" onClick={onClose} data-testid="button-cancel">
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={createTestCaseMutation.isPending}
                data-testid="button-create-test-case"
              >
                {createTestCaseMutation.isPending ? "Creating..." : "Create Test Case"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
