import { PageHeader } from "@/components/page-header";
import { AppLayout } from "@/layout/app-layout";
import { NotificationsList } from "@/components/notifications-list";
import { Bell } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RemindersList } from "@/components/reminders-list";

export default function NotificationsPage() {
  return (
    <AppLayout>
      <PageHeader
        heading="Bildirimler ve Hatırlatıcılar"
        text="Sistem bildirimleri ve görev hatırlatıcılarını yönetin."
        icon={<Bell className="h-6 w-6" />}
      />

      <div className="space-y-6">
        <Tabs defaultValue="notifications" className="w-full">
          <TabsList className="w-full max-w-md grid grid-cols-2">
            <TabsTrigger value="notifications">Bildirimler</TabsTrigger>
            <TabsTrigger value="reminders">Hatırlatıcılar</TabsTrigger>
          </TabsList>
          <TabsContent value="notifications" className="space-y-4 mt-6">
            <NotificationsList />
          </TabsContent>
          <TabsContent value="reminders" className="space-y-4 mt-6">
            <RemindersList />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}