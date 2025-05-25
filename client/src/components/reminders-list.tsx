import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AlarmClock, CalendarClock, Check, Loader2, Plus, Trash2, Clock } from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ReminderForm } from "./reminder-form";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";

interface Reminder {
  id: number;
  taskId: number;
  userId: number;
  reminderDate: string;
  reminderType: string;
  message: string | null;
  sent: boolean;
  createdAt: string;
  updatedAt: string;
  task?: {
    id: number;
    title: string;
  };
}

export function RemindersList() {
  const { toast } = useToast();
  const [selectedReminderId, setSelectedReminderId] = useState<number | null>(null);

  // Hatırlatıcıları getir
  const { data: reminders, isLoading } = useQuery({
    queryKey: ["/api/reminders"],
    queryFn: async () => {
      const data = await apiRequest("/api/reminders");
      return data || [];
    }
  });

  // Görevleri getir (görev isimlerini göstermek için)
  const { data: tasks } = useQuery({
    queryKey: ["/api/tasks"],
    queryFn: async () => {
      const data = await apiRequest("/api/tasks");
      return data || [];
    }
  });

  // Hatırlatıcıyı sil
  const deleteReminderMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest(`/api/reminders/${id}`, {
        method: "DELETE"
      });
    },
    onSuccess: () => {
      toast({
        title: "Başarılı",
        description: "Hatırlatıcı başarıyla silindi",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/reminders"] });
    },
    onError: (error) => {
      console.error("Hatırlatıcı silme hatası:", error);
      toast({
        title: "Hata",
        description: "Hatırlatıcı silinirken bir hata oluştu",
        variant: "destructive",
      });
    }
  });

  // Hatırlatıcıyı gönderildi olarak işaretle
  const markAsSentMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest(`/api/reminders/${id}`, {
        method: "PATCH",
        body: JSON.stringify({
          sent: true
        })
      });
    },
    onSuccess: () => {
      toast({
        title: "Başarılı",
        description: "Hatırlatıcı gönderildi olarak işaretlendi",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/reminders"] });
    },
    onError: (error) => {
      console.error("Hatırlatıcı güncelleme hatası:", error);
      toast({
        title: "Hata",
        description: "Hatırlatıcı güncellenirken bir hata oluştu",
        variant: "destructive",
      });
    }
  });

  const handleDeleteReminder = (id: number) => {
    deleteReminderMutation.mutate(id);
    setSelectedReminderId(null);
  };

  const handleMarkAsSent = (id: number) => {
    markAsSentMutation.mutate(id);
  };

  // Görev adını bul
  const getTaskTitle = (taskId: number) => {
    const task = tasks?.find((t: any) => t.id === taskId);
    return task ? task.title : `Görev #${taskId}`;
  };

  if (isLoading) {
    return <RemindersListSkeleton />;
  }

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <div className="text-sm text-muted-foreground">
          {reminders?.length > 0 ? `${reminders.length} hatırlatıcı` : 'Hatırlatıcı bulunmuyor'}
        </div>
        <ReminderForm 
          buttonLabel="Yeni Hatırlatıcı"
          triggerButton={
            <Button size="sm" variant="outline">
              <Plus className="mr-2 h-3.5 w-3.5" />
              Yeni Hatırlatıcı
            </Button>
          }
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ["/api/reminders"] });
          }}
        />
      </div>

      {reminders && reminders.length > 0 ? (
        <div className="space-y-2 overflow-auto">
          {reminders.map((reminder: any) => (
            <ReminderItem
              key={reminder.id}
              reminder={reminder}
              getTaskTitle={getTaskTitle}
              onMarkAsSent={handleMarkAsSent}
              onDelete={() => setSelectedReminderId(reminder.id)}
              isMarking={markAsSentMutation.isPending && markAsSentMutation.variables === reminder.id}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-6 text-muted-foreground bg-card rounded-lg border p-4 mt-4">
          <CalendarClock className="mx-auto h-8 w-8 opacity-20 mb-2" />
          <p>Henüz hatırlatıcı bulunmuyor.</p>
          <p className="text-sm mt-1">Yeni bir hatırlatıcı eklemek için "Yeni Hatırlatıcı" düğmesine tıklayın.</p>
        </div>
      )}

      <AlertDialog open={selectedReminderId !== null} onOpenChange={(open) => !open && setSelectedReminderId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hatırlatıcıyı silmek istediğinizden emin misiniz?</AlertDialogTitle>
            <AlertDialogDescription>
              Bu işlem geri alınamaz. Bu hatırlatıcı kalıcı olarak silinecektir.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedReminderId(null)}>
              İptal
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => selectedReminderId && handleDeleteReminder(selectedReminderId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteReminderMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Siliniyor...
                </>
              ) : (
                "Evet, sil"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

interface ReminderItemProps {
  reminder: Reminder;
  getTaskTitle: (taskId: number) => string;
  onMarkAsSent: (id: number) => void;
  onDelete: () => void;
  isMarking: boolean;
}

function ReminderItem({ reminder, getTaskTitle, onMarkAsSent, onDelete, isMarking }: ReminderItemProps) {
  return (
    <div className={`p-3 rounded-md border ${reminder.sent ? 'bg-muted/20' : 'bg-card border-primary/20'}`}>
      <div className="flex items-start gap-2">
        <div className={`mt-0.5 rounded-full p-1.5 ${
          reminder.sent 
            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300" 
            : "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300"
        }`}>
          <Clock className="h-4 w-4" />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-1">
            <h4 className="font-medium text-sm">{getTaskTitle(reminder.taskId)}</h4>
            <Badge variant="outline" className="ml-2 text-xs">
              {reminder.reminderType === "email" && "E-posta"}
              {reminder.reminderType === "notification" && "Bildirim"}
              {reminder.reminderType === "both" && "E-posta & Bildirim"}
            </Badge>
          </div>
          
          <div className="flex items-center text-xs text-muted-foreground mb-2">
            <AlarmClock className="h-3 w-3 mr-1 inline-block" />
            {format(new Date(reminder.reminderDate), "d MMMM yyyy HH:mm", { locale: tr })}
            <Badge 
              variant={reminder.sent ? "outline" : "secondary"} 
              className={`ml-2 ${
                reminder.sent 
                  ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300" 
                  : "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300"
              }`}
            >
              {reminder.sent ? "Gönderildi" : "Bekliyor"}
            </Badge>
          </div>
          
          {reminder.message && (
            <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{reminder.message}</p>
          )}
          
          <div className="flex justify-end gap-2">
            {!reminder.sent && (
              <Button 
                variant="ghost" 
                size="sm"
                className="h-7 text-xs"
                onClick={() => onMarkAsSent(reminder.id)}
                disabled={isMarking}
              >
                {isMarking ? (
                  <Loader2 className="h-3 w-3 animate-spin mr-1" />
                ) : (
                  <Check className="h-3 w-3 mr-1" />
                )}
                Gönderildi İşaretle
              </Button>
            )}
            <Button 
              variant="ghost" 
              size="sm"
              className="h-7 text-xs text-destructive hover:text-destructive/90"
              onClick={onDelete}
            >
              <Trash2 className="h-3 w-3 mr-1" />
              Sil
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function RemindersListSkeleton() {
  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-4">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-9 w-36" />
      </div>
      
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="p-3 rounded-md border">
            <div className="flex gap-2">
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="flex-1">
                <div className="flex justify-between items-start mb-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-5 w-20" />
                </div>
                <Skeleton className="h-3 w-40 mb-2" />
                <Skeleton className="h-3 w-full mb-2" />
                <div className="flex justify-end gap-2">
                  <Skeleton className="h-7 w-28" />
                  <Skeleton className="h-7 w-16" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}