import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Bell, CheckCircle, Eye, Trash2, Clock, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
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

interface Notification {
  id: number;
  userId: number;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  relatedTaskId: number | null;
  relatedPlanId: number | null;
  createdAt: string;
}

export function NotificationsList() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("all");
  const [selectedNotificationId, setSelectedNotificationId] = useState<number | null>(null);

  // Bildirimleri getir
  const { data: notifications, isLoading } = useQuery({
    queryKey: ["/api/notifications"],
    queryFn: async () => {
      const data = await apiRequest<Notification[]>("/api/notifications");
      return data || [];
    }
  });

  // Okunmamış bildirimleri getir
  const { data: unreadNotifications } = useQuery({
    queryKey: ["/api/notifications/unread"],
    queryFn: async () => {
      const data = await apiRequest<Notification[]>("/api/notifications/unread");
      return data || [];
    }
  });

  // Bildirimi okundu olarak işaretle
  const markAsReadMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest(`/api/notifications/${id}/read`, {
        method: "PATCH"
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/unread"] });
    }
  });

  // Tüm bildirimleri okundu olarak işaretle
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("/api/notifications/read-all", {
        method: "PATCH"
      });
    },
    onSuccess: () => {
      toast({
        title: "Başarılı",
        description: "Tüm bildirimler okundu olarak işaretlendi.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/unread"] });
    }
  });

  // Bildirimi sil
  const deleteNotificationMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest(`/api/notifications/${id}`, {
        method: "DELETE"
      });
    },
    onSuccess: () => {
      toast({
        title: "Başarılı",
        description: "Bildirim silindi.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/unread"] });
      setSelectedNotificationId(null);
    }
  });

  const handleMarkAsRead = (id: number) => {
    markAsReadMutation.mutate(id);
  };

  const handleMarkAllAsRead = () => {
    markAllAsReadMutation.mutate();
  };

  const handleDeleteNotification = (id: number) => {
    deleteNotificationMutation.mutate(id);
  };

  // Bildirim türüne göre renk belirle
  const getNotificationColor = (type: string) => {
    switch (type) {
      case "info":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case "success":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "warning":
        return "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300";
      case "error":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      default:
        return "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300";
    }
  };

  // Bildirim türüne göre icon belirle
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "info":
        return <Bell className="h-4 w-4" />;
      case "success":
        return <CheckCircle className="h-4 w-4" />;
      case "warning":
        return <Clock className="h-4 w-4" />;
      case "error":
        return <ExternalLink className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  if (isLoading) {
    return <NotificationsListSkeleton />;
  }

  const displayNotifications = activeTab === "all" 
    ? notifications 
    : unreadNotifications;

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex justify-between items-center mb-4">
        {unreadNotifications && unreadNotifications.length > 0 && (
          <Button 
            size="sm" 
            variant="outline" 
            onClick={handleMarkAllAsRead}
            disabled={markAllAsReadMutation.isPending}
            className="ml-auto"
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Tümünü Okundu İşaretle
          </Button>
        )}
      </div>
      
      <Tabs defaultValue="all" className="w-full" onValueChange={setActiveTab}>
        <TabsList className="w-full grid grid-cols-2 mb-4">
          <TabsTrigger value="all">Tüm Bildirimler</TabsTrigger>
          <TabsTrigger value="unread">
            Okunmamış
            {unreadNotifications && unreadNotifications.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {unreadNotifications.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="mt-0">
          {notifications && notifications.length > 0 ? (
            <div className="space-y-2">
              {notifications.map((notification) => (
                <NotificationItem 
                  key={notification.id} 
                  notification={notification} 
                  onMarkAsRead={handleMarkAsRead} 
                  onDelete={(id) => {
                    setSelectedNotificationId(id);
                  }}
                  getNotificationColor={getNotificationColor}
                  getNotificationIcon={getNotificationIcon}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-muted-foreground bg-card rounded-lg border p-4">
              <Bell className="mx-auto h-8 w-8 opacity-20 mb-2" />
              <p>Henüz bildirim bulunmuyor.</p>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="unread" className="mt-0">
          {unreadNotifications && unreadNotifications.length > 0 ? (
            <div className="space-y-2">
              {unreadNotifications.map((notification) => (
                <NotificationItem 
                  key={notification.id} 
                  notification={notification} 
                  onMarkAsRead={handleMarkAsRead} 
                  onDelete={(id) => {
                    setSelectedNotificationId(id);
                  }}
                  getNotificationColor={getNotificationColor}
                  getNotificationIcon={getNotificationIcon}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-muted-foreground bg-card rounded-lg border p-4">
              <CheckCircle className="mx-auto h-8 w-8 opacity-20 mb-2" />
              <p>Okunmamış bildirim bulunmuyor.</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
      
      <AlertDialog open={selectedNotificationId !== null} onOpenChange={(open) => !open && setSelectedNotificationId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Bildirimi Sil</AlertDialogTitle>
            <AlertDialogDescription>
              Bu bildirimi silmek istediğinize emin misiniz? Bu işlem geri alınamaz.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => selectedNotificationId && handleDeleteNotification(selectedNotificationId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Evet, Sil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: (id: number) => void;
  onDelete: (id: number) => void;
  getNotificationColor: (type: string) => string;
  getNotificationIcon: (type: string) => React.ReactNode;
}

function NotificationItem({ 
  notification, 
  onMarkAsRead, 
  onDelete, 
  getNotificationColor,
  getNotificationIcon
}: NotificationItemProps) {
  return (
    <div 
      className={`py-2 px-3 rounded-md border ${notification.isRead ? 'opacity-80 bg-muted/20' : 'border-primary/20 bg-card shadow-sm'}`}
    >
      <div className="flex items-start gap-2">
        <div className={`mt-0.5 rounded-full p-1.5 ${getNotificationColor(notification.type)}`}>
          {getNotificationIcon(notification.type)}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-0.5">
            <h4 className="font-medium text-sm truncate mr-2">{notification.title}</h4>
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {format(new Date(notification.createdAt), "d MMM HH:mm", { locale: tr })}
            </span>
          </div>
          <p className="text-xs text-muted-foreground line-clamp-2 mb-1">{notification.message}</p>
          
          <div className="flex justify-end gap-2 mt-1">
            {!notification.isRead && (
              <Button 
                size="sm" 
                variant="ghost" 
                className="h-7 text-xs px-2 py-1"
                onClick={() => onMarkAsRead(notification.id)}
              >
                <Eye className="h-3 w-3 mr-1" />
                Okundu
              </Button>
            )}
            <Button 
              size="sm" 
              variant="ghost" 
              className="h-7 text-xs px-2 py-1 text-destructive hover:text-destructive/90"
              onClick={() => onDelete(notification.id)}
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

function NotificationsListSkeleton() {
  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-4">
        <Skeleton className="h-9 w-36 ml-auto" />
      </div>
      
      <Skeleton className="h-10 w-full mb-4" />
      
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="p-3 rounded-md border">
            <div className="flex gap-2">
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="flex-1">
                <div className="flex justify-between items-start mb-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-16" />
                </div>
                <Skeleton className="h-3 w-full mb-1" />
                <Skeleton className="h-3 w-4/5 mb-3" />
                <div className="flex justify-end gap-2">
                  <Skeleton className="h-7 w-16" />
                  <Skeleton className="h-7 w-12" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}