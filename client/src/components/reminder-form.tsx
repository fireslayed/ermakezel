import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { CalendarClock, CheckCircle, Clock, Plus } from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

// Hatırlatıcı form şeması
const reminderFormSchema = z.object({
  taskId: z.number({
    required_error: "Görev seçilmelidir",
  }),
  reminderDate: z.date({
    required_error: "Hatırlatıcı tarihi gereklidir",
  }),
  reminderType: z.string().default("email"),
  message: z.string().optional(),
});

type ReminderFormValues = z.infer<typeof reminderFormSchema>;

interface ReminderFormProps {
  onSuccess?: () => void;
  defaultValues?: Partial<ReminderFormValues>;
  taskId?: number;
  buttonLabel?: string;
  triggerButton?: React.ReactNode;
}

export function ReminderForm({
  onSuccess,
  defaultValues,
  taskId,
  buttonLabel = "Hatırlatıcı Ekle",
  triggerButton,
}: ReminderFormProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);

  // Görevleri getir
  const { data: tasks } = useQuery({
    queryKey: ["/api/tasks"],
    queryFn: async () => {
      const data = await apiRequest<any[]>("/api/tasks");
      return data || [];
    },
  });

  // Form oluştur
  const form = useForm<ReminderFormValues>({
    resolver: zodResolver(reminderFormSchema),
    defaultValues: {
      taskId: taskId || 0,
      reminderType: "email",
      message: "",
      ...defaultValues,
    },
  });

  // Hatırlatıcı oluştur
  const createReminderMutation = useMutation({
    mutationFn: async (data: ReminderFormValues) => {
      return await apiRequest("/api/reminders", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      toast({
        title: "Başarılı",
        description: "Hatırlatıcı başarıyla oluşturuldu",
        variant: "success",
      });
      form.reset();
      setOpen(false);
      if (onSuccess) onSuccess();
      queryClient.invalidateQueries({ queryKey: ["/api/reminders"] });
      queryClient.invalidateQueries({ queryKey: [`/api/tasks/${taskId}/reminders`] });
    },
    onError: (error) => {
      console.error("Hatırlatıcı oluşturma hatası:", error);
      toast({
        title: "Hata",
        description: "Hatırlatıcı oluşturulurken bir hata oluştu",
        variant: "destructive",
      });
    },
  });

  function onSubmit(data: ReminderFormValues) {
    createReminderMutation.mutate(data);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {triggerButton || (
          <Button variant="outline" size="sm">
            <Plus className="mr-2 h-4 w-4" />
            {buttonLabel}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarClock className="h-5 w-5" />
            Hatırlatıcı Oluştur
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2">
            {!taskId && (
              <FormField
                control={form.control}
                name="taskId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Görev</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(parseInt(value))}
                      defaultValue={field.value?.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Bir görev seçin" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {tasks?.map((task) => (
                          <SelectItem key={task.id} value={task.id.toString()}>
                            {task.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="reminderDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Hatırlatıcı Tarihi</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP HH:mm", { locale: tr })
                          ) : (
                            <span>Tarih ve saat seçin</span>
                          )}
                          <Clock className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={(date) => {
                          if (date) {
                            const currentDate = field.value || new Date();
                            const newDate = new Date(date);
                            newDate.setHours(currentDate.getHours());
                            newDate.setMinutes(currentDate.getMinutes());
                            field.onChange(newDate);
                          }
                        }}
                        initialFocus
                      />
                      <div className="p-3 border-t">
                        <div className="flex items-center justify-between">
                          <Input
                            type="time"
                            value={
                              field.value
                                ? format(field.value, "HH:mm")
                                : format(new Date(), "HH:mm")
                            }
                            onChange={(e) => {
                              const [hours, minutes] = e.target.value.split(":").map(Number);
                              const newDate = field.value || new Date();
                              newDate.setHours(hours);
                              newDate.setMinutes(minutes);
                              field.onChange(newDate);
                            }}
                            className="w-full"
                          />
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="reminderType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Hatırlatıcı Türü</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Hatırlatıcı türünü seçin" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="email">E-posta</SelectItem>
                      <SelectItem value="notification">Bildirim</SelectItem>
                      <SelectItem value="both">Her İkisi</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Hatırlatıcı Mesajı (İsteğe Bağlı)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Hatırlatıcı için özel bir mesaj yazın"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setOpen(false)}
              >
                İptal
              </Button>
              <Button 
                type="submit" 
                disabled={createReminderMutation.isPending}
              >
                {createReminderMutation.isPending ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Oluşturuluyor...
                  </span>
                ) : (
                  <span className="flex items-center">
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Hatırlatıcı Oluştur
                  </span>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}