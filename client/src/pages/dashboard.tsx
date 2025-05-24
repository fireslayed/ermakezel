import { DashboardStats } from "@/components/dashboard-stats";
import { TaskList } from "@/components/task-list";
import { TaskForm } from "@/components/task-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { FileText, Clock, CheckCircle, AlertCircle } from "lucide-react";
import { format } from 'date-fns';
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";

// Rapor durum bilgileri
const reportStatusMap = {
  "draft": { label: "Taslak", color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300", icon: <Clock className="h-3 w-3 mr-1" /> },
  "sent": { label: "Gönderildi", color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300", icon: <CheckCircle className="h-3 w-3 mr-1" /> },
  "pending": { label: "İşlemde", color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300", icon: <Clock className="h-3 w-3 mr-1" /> },
  "rejected": { label: "Reddedildi", color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300", icon: <AlertCircle className="h-3 w-3 mr-1" /> },
};

// Rapor türleri için çeviriler
const reportTypeTranslations = {
  "daily": "Günlük Rapor",
  "installation": "Kurulum Raporu",
  "maintenance": "Bakım Raporu",
  "inspection": "Denetim Raporu",
  "incident": "Olay Raporu",
  "production": "Üretim Raporu",
};

export default function Dashboard() {
  // Raporları getir
  const { data: reports = [], isLoading: isLoadingReports } = useQuery({
    queryKey: ['/api/reports'],
  });

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Gösterge Paneli</h2>
        <TaskForm />
      </div>
      
      <div className="space-y-4">
        <DashboardStats />
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Son Raporlar</CardTitle>
              <CardDescription>
                En son eklenen raporları görüntüleyin ve yönetin
              </CardDescription>
            </div>
            <Link href="/reports">
              <Button variant="outline" size="sm">
                Tüm Raporlar
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {isLoadingReports ? (
              <div className="flex justify-center p-4">
                <p>Raporlar yükleniyor...</p>
              </div>
            ) : reports && reports.length > 0 ? (
              <div className="space-y-4">
                {reports.slice(0, 5).map((report: any) => (
                  <div key={report.id} className="flex items-start justify-between border-b pb-4">
                    <div className="flex items-start space-x-4">
                      <div className="bg-primary/10 p-2 rounded-md">
                        <FileText className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="font-medium">{report.title}</h4>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge variant="outline">
                            {reportTypeTranslations[report.reportType] || report.reportType}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {report.createdAt && format(new Date(report.createdAt), 'dd.MM.yyyy HH:mm')}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <Badge className={reportStatusMap[report.status]?.color || "bg-gray-100"}>
                        <span className="flex items-center">
                          {reportStatusMap[report.status]?.icon}
                          {reportStatusMap[report.status]?.label || report.status}
                        </span>
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-muted-foreground">Henüz hiç rapor bulunmuyor</p>
                <Link href="/reports">
                  <Button variant="outline" className="mt-2">
                    İlk Raporu Oluştur
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
