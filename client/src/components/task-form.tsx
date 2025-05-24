import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertTaskSchema, type InsertTask } from "@shared/schema";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Plus } from "lucide-react";
import { format } from "date-fns";

// Extend the task schema with form validations
const taskFormSchema = insertTaskSchema.extend({
  title: z.string().min(3, "Başlık en az 3 karakter olmalıdır"),
  dueDate: z.date().optional(),
  planId: z.number().optional(),
  userIds: z.array(z.number()).optional(),
});

type TaskFormValues = z.infer<typeof taskFormSchema>;

interface TaskFormProps {
  onSuccess?: () => void;
  defaultValues?: Partial<TaskFormValues>;
  taskId?: number;
  buttonLabel?: string;
  triggerButton?: React.ReactNode;
}

export function TaskForm({ 
  onSuccess, 
  defaultValues,
  taskId,
  buttonLabel = "Görev Ekle",
  triggerButton
}: TaskFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [open, setOpen] = React.useState(false);
  
  // Fetch projects for the dropdown
  const { data: projects } = useQuery({
    queryKey: ['/api/projects'],
  });
  
  // Fetch plans for the dropdown
  const { data: plans } = useQuery({
    queryKey: ['/api/plans'],
  });
  
  // Fetch users for assignment
  const { data: users } = useQuery({
    queryKey: ['/api/users'],
    retry: false, // Yetkisiz kullanıcılar için tekrar denemeden vazgeç
    // @ts-ignore
    onError: (error) => {
      // Yalnızca yöneticiler kullanıcı listesine erişebilir
      console.error("Kullanıcı listesi alınamadı", error);
    }
  });

  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: defaultValues || {
      title: "",
      description: "",
      status: "pending",
      priority: "medium",
      completed: false,
      planId: undefined,
      userIds: []
    }
  });
  
  const isEditing = !!taskId;
  
  const taskMutation = useMutation({
    mutationFn: async (data: TaskFormValues) => {
      // Önce normal görev oluşturma/güncelleme işlemini yap
      if (isEditing) {
        const res = await apiRequest("PATCH", `/api/tasks/${taskId}`, data);
        return res.json();
      } else {
        const res = await apiRequest("POST", "/api/tasks", data);
        const taskData = await res.json();
        
        // Eğer kullanıcı atama yapıldıysa ve yeni görev oluşturulduysa
        if (data.userIds && data.userIds.length > 0 && taskData.id) {
          // Görevi kullanıcılara ata
          await apiRequest("POST", `/api/tasks/${taskData.id}/assign`, { userIds: data.userIds });
        }
        
        return taskData;
      }
    },
    onSuccess: () => {
      toast({
        title: isEditing ? "Görev güncellendi" : "Görev oluşturuldu",
        description: isEditing ? "Göreviniz başarıyla güncellendi" : "Yeni göreviniz oluşturuldu",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
      setOpen(false);
      form.reset();
      if (onSuccess) onSuccess();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    }
  });

  function onSubmit(data: TaskFormValues) {
    taskMutation.mutate(data);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {triggerButton || (
          <Button>
            <Plus className="mr-2 h-4 w-4" /> {buttonLabel}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Görevi Düzenle" : "Yeni görev oluştur"}</DialogTitle>
          <DialogDescription>
            {isEditing ? "Görev detaylarını aşağıdan güncelleyin" : "Yeni göreviniz için detayları doldurun"}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Başlık</FormLabel>
                  <FormControl>
                    <Input placeholder="Görev başlığı" {...field} />
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
                    <Textarea placeholder="Task description" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priority</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
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
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="in-progress">In Progress</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="projectId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Project</FormLabel>
                  <Select 
                    onValueChange={(value) => field.onChange(parseInt(value))} 
                    defaultValue={field.value?.toString()}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select project" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {projects?.map((project) => (
                        <SelectItem 
                          key={project.id} 
                          value={project.id.toString()}
                        >
                          {project.name}
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
              name="dueDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Due Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={`w-full pl-3 text-left font-normal ${!field.value && "text-muted-foreground"}`}
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="planId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Plan</FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(value ? parseInt(value) : undefined)}
                    value={field.value?.toString() || ""}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Plan seçin (opsiyonel)" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {plans && Array.isArray(plans) && plans.map((plan: any) => (
                        <SelectItem key={plan.id} value={plan.id.toString()}>
                          {plan.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Bu görevin ilişkili olduğu planı seçin
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {users && Array.isArray(users) && users.length > 0 && (
              <FormField
                control={form.control}
                name="userIds"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Atanacak Kullanıcılar</FormLabel>
                    <div className="space-y-2">
                      {users.map((user: any) => (
                        <div key={user.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`user-${user.id}`}
                            checked={field.value?.includes(user.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                field.onChange([...(field.value || []), user.id]);
                              } else {
                                field.onChange(
                                  field.value?.filter((id: number) => id !== user.id) || []
                                );
                              }
                            }}
                          />
                          <label
                            htmlFor={`user-${user.id}`}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            {user.fullName || user.username}
                          </label>
                        </div>
                      ))}
                    </div>
                    <FormDescription>
                      Bu görevi atamak istediğiniz kullanıcıları seçin
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            
            <FormField
              control={form.control}
              name="completed"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Tamamlandı</FormLabel>
                    <FormDescription>
                      Bu görevi tamamlandı olarak işaretleyin
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />
            
            <DialogFooter>
              <Button type="submit" disabled={taskMutation.isPending}>
                {taskMutation.isPending ? "Kaydediliyor..." : (isEditing ? "Görevi Güncelle" : "Görev Oluştur")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// Needed to fix the reference error since it was missing
import { FormDescription } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import * as React from "react";
