import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Edit, Trash2, FileText } from "lucide-react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Requirement } from "@shared/schema";
import { insertRequirementSchema } from "@shared/schema";
import { RichTextEditor } from "@/components/ui/rich-text-editor";

const formSchema = insertRequirementSchema;

export default function Requirements() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRequirement, setEditingRequirement] = useState<Requirement | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      module: "",
      priority: "medium",
      author: "",
    },
  });

  const { data: requirements, isLoading, isError, error } = useQuery<Requirement[]>({
    queryKey: ["/api/requirements"],
  });

  const createRequirementMutation = useMutation({
    mutationFn: async (data: z.infer<typeof formSchema>) => {
      const response = await apiRequest("POST", "/api/requirements", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Requirement created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/requirements"] });
      form.reset();
      setIsModalOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create requirement",
        variant: "destructive",
      });
    },
  });

  const updateRequirementMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: z.infer<typeof formSchema> }) => {
      const response = await apiRequest("PUT", `/api/requirements/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Requirement updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/requirements"] });
      form.reset();
      setEditingRequirement(null);
      setIsModalOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update requirement",
        variant: "destructive",
      });
    },
  });

  const deleteRequirementMutation = useMutation({
    mutationFn: async (requirementId: string) => {
      await apiRequest("DELETE", `/api/requirements/${requirementId}`);
    },
    onSuccess: () => {
      toast({
        title: "Requirement Deleted",
        description: "Requirement has been deleted",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/requirements"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete requirement",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    // Auto-generate requirement ID
    const requirementData = {
      ...data,
      requirementId: `REQ-${Date.now().toString().slice(-6)}`
    };
    
    if (editingRequirement) {
      updateRequirementMutation.mutate({ id: editingRequirement.id, data: requirementData });
    } else {
      createRequirementMutation.mutate(requirementData);
    }
  };

  const handleEditRequirement = (requirement: Requirement) => {
    setEditingRequirement(requirement);
    form.reset({
      title: requirement.title,
      description: requirement.description || "",
      module: requirement.module || "",
      priority: requirement.priority as "high" | "medium" | "low",
      author: requirement.author,
    });
    setIsModalOpen(true);
  };

  const handleCancelEdit = () => {
    setEditingRequirement(null);
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

  return (
    <div className="min-h-screen flex">
      <Sidebar />
      
      <main className="flex-1 flex flex-col">
        <MobileHeader />

        <div className="bg-card border-b border-border px-6 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-bold text-foreground">Requirements</h2>
              <p className="text-muted-foreground">
                Manage project requirements and specifications ({requirements?.length || 0} requirements)
              </p>
            </div>
            <div className="mt-4 sm:mt-0">
              <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogTrigger asChild>
                  <Button data-testid="button-new-requirement">
                    <Plus className="w-4 h-4 mr-2" />
                    New Requirement
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>{editingRequirement ? "Edit Requirement" : "Create New Requirement"}</DialogTitle>
                  </DialogHeader>
                  
                  <div className="max-h-[70vh] overflow-y-auto pr-2">
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                          control={form.control}
                          name="title"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Title *</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="Enter requirement title" 
                                  {...field} 
                                  data-testid="input-requirement-title"
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
                              <RichTextEditor
                                content={field.value || ""}
                                onChange={field.onChange}
                                placeholder="Describe the requirement in detail..."
                                data-testid="rich-text-editor-description"
                                className="min-h-[200px]"
                              />
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
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
                                  data-testid="input-requirement-module"
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
                              <FormLabel>Priority *</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger data-testid="select-requirement-priority">
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
                          name="author"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Author</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="Enter author name" 
                                  {...field} 
                                  data-testid="input-requirement-author"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </form>
                    </Form>
                  </div>
                  
                  <div className="sticky bottom-0 bg-background border-t pt-4 flex justify-end space-x-3">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={handleCancelEdit}
                      data-testid="button-cancel"
                    >
                      Cancel
                    </Button>
                    <Button 
                      onClick={form.handleSubmit(onSubmit)}
                      disabled={createRequirementMutation.isPending || updateRequirementMutation.isPending}
                      data-testid={editingRequirement ? "button-update-requirement" : "button-create-requirement"}
                    >
                      {editingRequirement ? (
                        updateRequirementMutation.isPending ? "Updating..." : "Update Requirement"
                      ) : (
                        createRequirementMutation.isPending ? "Creating..." : "Create Requirement"
                      )}
                    </Button>
                  </div>
                      <FormField
                        control={form.control}
                        name="title"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Title *</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Enter requirement title" 
                                {...field} 
                                data-testid="input-requirement-title"
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
                            <RichTextEditor
                              content={field.value || ""}
                              onChange={field.onChange}
                              placeholder="Describe the requirement in detail..."
                              data-testid="rich-text-editor-description"
                              className="min-h-[200px]"
                            />
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
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
                                data-testid="input-requirement-module"
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
                            <FormLabel>Priority *</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-requirement-priority">
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
                        name="author"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Author</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Enter author name" 
                                {...field} 
                                data-testid="input-requirement-author"
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
                          disabled={createRequirementMutation.isPending || updateRequirementMutation.isPending}
                          data-testid={editingRequirement ? "button-update-requirement" : "button-create-requirement"}
                        >
                          {editingRequirement ? (
                            updateRequirementMutation.isPending ? "Updating..." : "Update Requirement"
                          ) : (
                            createRequirementMutation.isPending ? "Creating..." : "Create Requirement"
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
          {isError ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-destructive mx-auto mb-4" />
              <h3 className="text-lg font-medium text-destructive mb-2">Failed to load requirements</h3>
              <p className="text-muted-foreground mb-6">
                {error instanceof Error ? error.message : "An error occurred while fetching requirements"}
              </p>
              <Button onClick={() => window.location.reload()} data-testid="button-retry-requirements">
                Try Again
              </Button>
            </div>
          ) : isLoading ? (
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
          ) : !requirements || requirements.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-muted-foreground mb-2">No requirements found</h3>
              <p className="text-muted-foreground mb-6">Get started by creating your first requirement</p>
              <Button onClick={() => setIsModalOpen(true)} data-testid="button-create-first-requirement">
                <Plus className="w-4 h-4 mr-2" />
                Create Requirement
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {requirements.map((requirement) => (
                <Card key={requirement.id} className="hover:shadow-md transition-shadow" data-testid={`requirement-card-${requirement.id}`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {requirement.requirementId && (
                            <Badge variant="outline" className="text-xs" data-testid="requirement-id">
                              {requirement.requirementId}
                            </Badge>
                          )}
                          {getPriorityBadge(requirement.priority)}
                        </div>
                        <CardTitle className="text-lg leading-tight" data-testid="requirement-title">
                          {requirement.title}
                        </CardTitle>
                      </div>
                    </div>
                    {requirement.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2" data-testid="requirement-description">
                        <div 
                          className="prose prose-sm max-w-none text-muted-foreground [&>*]:text-muted-foreground"
                          dangerouslySetInnerHTML={{
                            __html: requirement.description
                          }}
                        />
                      </p>
                    )}
                  </CardHeader>
                  
                  <CardContent className="pt-0">
                    {requirement.module && (
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-muted-foreground">Module</span>
                        <span className="font-medium" data-testid="requirement-module">{requirement.module}</span>
                      </div>
                    )}
                    
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Author</span>
                      <span className="font-medium" data-testid="requirement-author">{requirement.author}</span>
                    </div>

                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Created</span>
                      <span className="font-medium" data-testid="requirement-date">
                        {new Date(requirement.dateCreated).toLocaleDateString()}
                      </span>
                    </div>
                    
                    <div className="flex justify-between pt-4 border-t">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleEditRequirement(requirement)}
                        data-testid={`button-edit-requirement-${requirement.id}`}
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => deleteRequirementMutation.mutate(requirement.id)}
                        disabled={deleteRequirementMutation.isPending}
                        className="text-destructive hover:text-destructive/80"
                        data-testid={`button-delete-requirement-${requirement.id}`}
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