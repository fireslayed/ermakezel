import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Alarm, CalendarClock, Check, Loader2, Plus, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ReminderForm } from "./reminder-form";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
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
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <CardTitle className="text-2xl font-bold flex items-center gap-2">
            <Alarm className="h-5 w-5" />
            Hatırlatıcılar
          </CardTitle>
          <ReminderForm 
            buttonLabel="Yeni Hatırlatıcı"
            triggerButton={
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Yeni Hatırlatıcı
              </Button>
            }
            onSuccess={() => {
              queryClient.invalidateQueries({ queryKey: ["/api/reminders"] });
            }}
          />
        </div>
      </CardHeader>
      <CardContent>
        {reminders && reminders.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Görev</TableHead>
                <TableHead>Tarih</TableHead>
                <TableHead>Tür</TableHead>
                <TableHead>Durum</TableHead>
                <TableHead className="text-right">İşlemler</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reminders.map((reminder: any) => (
                <TableRow key={reminder.id}>
                  <TableCell className="font-medium">
                    {getTaskTitle(reminder.taskId)}
                  </TableCell>
                  <TableCell>
                    {format(new Date(reminder.reminderDate), "d MMMM yyyy HH:mm", { locale: tr })}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {reminder.reminderType === "email" && "E-posta"}
                      {reminder.reminderType === "notification" && "Bildirim"}
                      {reminder.reminderType === "both" && "E-posta & Bildirim"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {reminder.sent ? (
                      <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                        Gönderildi
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300">
                        Bekliyor
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {!reminder.sent && (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleMarkAsSent(reminder.id)}
                          disabled={markAsSentMutation.isPending && selectedReminderId === reminder.id}
                        >
                          {markAsSentMutation.isPending && selectedReminderId === reminder.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Check className="h-4 w-4" />
                          )}
                          <span className="sr-only">Gönderildi İşaretle</span>
                        </Button>
                      )}
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="text-destructive hover:text-destructive/90"
                            onClick={() => setSelectedReminderId(reminder.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Sil</span>
                          </Button>
                        </AlertDialogTrigger>
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
                              onClick={() => handleDeleteReminder(selectedReminderId!)}
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
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center py-6 text-muted-foreground">
            <CalendarClock className="mx-auto h-12 w-12 opacity-20 mb-2" />
            <p>Henüz hatırlatıcı bulunmuyor.</p>
            <p className="text-sm mt-1">Yeni bir hatırlatıcı eklemek için "Yeni Hatırlatıcı" düğmesine tıklayın.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function RemindersListSkeleton() {
  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-10 w-36" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex items-center justify-between py-2">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-5 w-16" />
            <Skeleton className="h-5 w-16" />
            <Skeleton className="h-8 w-20" />
          </div>
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center justify-between py-4 border-t">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-6 w-20" />
              <Skeleton className="h-6 w-20" />
              <div className="flex gap-2">
                <Skeleton className="h-8 w-8" />
                <Skeleton className="h-8 w-8" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}