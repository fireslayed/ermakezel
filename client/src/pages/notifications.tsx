import { useState } from "react";
import { NotificationsList } from "@/components/notifications-list";
import { Bell, AlarmClock } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RemindersList } from "@/components/reminders-list";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Badge } from "@/components/ui/badge";

export default function NotificationsPage() {
  // Okunmamış bildirimleri al
  const { data: unreadNotifications } = useQuery({
    queryKey: ["/api/notifications/unread"],
    queryFn: async () => {
      const data = await apiRequest("/api/notifications/unread");
      return data || [];
    }
  });
  
  // Bekleyen hatırlatıcıları al
  const { data: pendingReminders } = useQuery({
    queryKey: ["/api/reminders"],
    queryFn: async () => {
      const data = await apiRequest("/api/reminders");
      return data ? data.filter((r: any) => !r.sent) : [];
    }
  });
  
  const unreadCount = unreadNotifications?.length || 0;
  const pendingCount = pendingReminders?.length || 0;
  
  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex items-center justify-between px-4 py-2 border-b bg-card">
        <h1 className="text-xl font-semibold">Bildirimler ve Hatırlatıcılar</h1>
      </div>
      
      <div className="flex-grow overflow-hidden">
        <Tabs defaultValue="notifications" className="h-full flex flex-col">
          <div className="px-4 pt-4 pb-0 border-b">
            <TabsList className="w-full max-w-md grid grid-cols-2">
              <TabsTrigger value="notifications" className="relative">
                <div className="flex items-center gap-2">
                  <Bell className="h-4 w-4" />
                  <span>Bildirimler</span>
                  {unreadCount > 0 && (
                    <Badge variant="destructive" className="ml-1">
                      {unreadCount}
                    </Badge>
                  )}
                </div>
              </TabsTrigger>
              <TabsTrigger value="reminders" className="relative">
                <div className="flex items-center gap-2">
                  <AlarmClock className="h-4 w-4" />
                  <span>Hatırlatıcılar</span>
                  {pendingCount > 0 && (
                    <Badge variant="secondary" className="ml-1">
                      {pendingCount}
                    </Badge>
                  )}
                </div>
              </TabsTrigger>
            </TabsList>
          </div>
          
          <div className="flex-grow overflow-auto p-4">
            <TabsContent value="notifications" className="h-full m-0">
              <NotificationsList />
            </TabsContent>
            <TabsContent value="reminders" className="h-full m-0">
              <RemindersList />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
}