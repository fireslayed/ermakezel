import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Bell, CheckCircle, Eye, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";

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
        variant: "success",
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
        variant: "success",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/unread"] });
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

  if (isLoading) {
    return <NotificationsListSkeleton />;
  }

  const displayNotifications = activeTab === "all" 
    ? notifications 
    : unreadNotifications;

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <CardTitle className="text-2xl font-bold flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Bildirimler
            {unreadNotifications && unreadNotifications.length > 0 && (
              <Badge variant="destructive" className="ml-2">
                {unreadNotifications.length}
              </Badge>
            )}
          </CardTitle>
          {unreadNotifications && unreadNotifications.length > 0 && (
            <Button 
              size="sm" 
              variant="outline" 
              onClick={handleMarkAllAsRead}
              disabled={markAllAsReadMutation.isPending}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Tümünü Okundu İşaretle
            </Button>
          )}
        </div>
      </CardHeader>
      <Tabs defaultValue="all" className="w-full" onValueChange={setActiveTab}>
        <div className="px-6">
          <TabsList className="grid w-full grid-cols-2 mb-4">
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
        </div>
        
        <CardContent className="pt-0">
          <TabsContent value="all" className="mt-0">
            {notifications && notifications.length > 0 ? (
              <div className="space-y-4">
                {notifications.map((notification) => (
                  <NotificationItem 
                    key={notification.id} 
                    notification={notification} 
                    onMarkAsRead={handleMarkAsRead} 
                    onDelete={handleDeleteNotification}
                    getNotificationColor={getNotificationColor}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                <Bell className="mx-auto h-12 w-12 opacity-20 mb-2" />
                <p>Henüz bildirim bulunmuyor.</p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="unread" className="mt-0">
            {unreadNotifications && unreadNotifications.length > 0 ? (
              <div className="space-y-4">
                {unreadNotifications.map((notification) => (
                  <NotificationItem 
                    key={notification.id} 
                    notification={notification} 
                    onMarkAsRead={handleMarkAsRead} 
                    onDelete={handleDeleteNotification}
                    getNotificationColor={getNotificationColor}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                <CheckCircle className="mx-auto h-12 w-12 opacity-20 mb-2" />
                <p>Okunmamış bildirim bulunmuyor.</p>
              </div>
            )}
          </TabsContent>
        </CardContent>
      </Tabs>
    </Card>
  );
}

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: (id: number) => void;
  onDelete: (id: number) => void;
  getNotificationColor: (type: string) => string;
}

function NotificationItem({ notification, onMarkAsRead, onDelete, getNotificationColor }: NotificationItemProps) {
  return (
    <div 
      className={`p-4 rounded-lg border ${notification.isRead ? 'opacity-70' : 'border-primary/50 shadow-sm'}`}
    >
      <div className="flex justify-between items-start mb-1">
        <div className="flex items-center">
          <Badge className={`${getNotificationColor(notification.type)} mr-2`}>
            {notification.type === "info" && "Bilgi"}
            {notification.type === "success" && "Başarılı"}
            {notification.type === "warning" && "Uyarı"}
            {notification.type === "error" && "Hata"}
          </Badge>
          <h4 className="font-medium">{notification.title}</h4>
        </div>
        <span className="text-xs text-muted-foreground">
          {format(new Date(notification.createdAt), "d MMMM yyyy HH:mm", { locale: tr })}
        </span>
      </div>
      <p className="text-sm text-muted-foreground mb-3">{notification.message}</p>
      <div className="flex justify-end space-x-2">
        {!notification.isRead && (
          <Button 
            size="sm" 
            variant="ghost" 
            onClick={() => onMarkAsRead(notification.id)}
          >
            <Eye className="h-4 w-4 mr-1" />
            Okundu İşaretle
          </Button>
        )}
        <Button 
          size="sm" 
          variant="ghost" 
          className="text-destructive hover:text-destructive/90"
          onClick={() => onDelete(notification.id)}
        >
          <Trash2 className="h-4 w-4 mr-1" />
          Sil
        </Button>
      </div>
    </div>
  );
}

function NotificationsListSkeleton() {
  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-9 w-36" />
        </div>
      </CardHeader>
      <div className="px-6">
        <Skeleton className="h-10 w-full mb-4" />
      </div>
      <CardContent>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-4 rounded-lg border">
              <div className="flex justify-between items-start mb-1">
                <div className="flex items-center">
                  <Skeleton className="h-6 w-16 mr-2" />
                  <Skeleton className="h-5 w-40" />
                </div>
                <Skeleton className="h-4 w-24" />
              </div>
              <Skeleton className="h-4 w-full my-2" />
              <Skeleton className="h-4 w-3/4 mb-3" />
              <div className="flex justify-end space-x-2">
                <Skeleton className="h-9 w-28" />
                <Skeleton className="h-9 w-20" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}