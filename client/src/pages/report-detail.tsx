import { useEffect, useState } from "react";
import { useRoute, Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  FileText, 
  ArrowLeft, 
  Download, 
  Printer, 
  Send, 
  Edit, 
  Clock, 
  CheckCircle, 
  AlertCircle 
} from "lucide-react";

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
  "weekly": "Haftalık Rapor",
  "monthly": "Aylık Rapor",
  "issue": "Sorun Bildirimi",
};

export default function ReportDetail() {
  const [, params] = useRoute("/reports/:id");
  const [, setLocation] = useLocation();
  const reportId = params?.id ? parseInt(params.id) : null;
  
  // Rapor verilerini getir
  const { data: report, isLoading } = useQuery({
    queryKey: [`/api/reports/${reportId}`],
    enabled: !!reportId,
  });
  
  // Projeleri getir (raporun hangi projeye ait olduğunu göstermek için)
  const { data: projects = [] } = useQuery({
    queryKey: ['/api/projects'],
  });
  
  // Eğer reportId yoksa ana sayfaya yönlendir
  useEffect(() => {
    if (!reportId) {
      setLocation("/reports");
    }
  }, [reportId, setLocation]);
  
  // Raporu yazdır
  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>${report?.title || 'Rapor'}</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              .header { margin-bottom: 20px; }
              .title { font-size: 24px; font-weight: bold; margin-bottom: 5px; }
              .meta { font-size: 14px; color: #666; margin-bottom: 15px; }
              .content { line-height: 1.5; }
            </style>
          </head>
          <body>
            <div class="header">
              <div class="title">${report?.title || 'Rapor'}</div>
              <div class="meta">
                <p>Rapor Türü: ${reportTypeTranslations[report?.reportType] || report?.reportType || ''}</p>
                <p>Tarih: ${report?.createdAt ? format(new Date(report.createdAt), 'dd.MM.yyyy HH:mm') : ''}</p>
                <p>Durum: ${reportStatusMap[report?.status]?.label || report?.status || ''}</p>
              </div>
            </div>
            <div class="content">
              ${report?.description || ''}
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };
  
  // Raporu PDF olarak indir
  const handleDownload = () => {
    // PDF oluşturma işlemi burada yapılabilir
    // Örnek olarak browser yazdırma özelliğini kullanıyoruz
    handlePrint();
  };
  
  // Projenin adını bul
  const getProjectName = (projectId) => {
    if (!projectId || !projects.length) return 'Belirtilmemiş';
    const project = projects.find(p => p.id === projectId);
    return project ? project.name : 'Belirtilmemiş';
  };
  
  if (isLoading) {
    return (
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center">
          <Button variant="ghost" size="sm" className="mr-2" onClick={() => setLocation("/reports")}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Geri
          </Button>
          <Skeleton className="h-8 w-48" />
        </div>
        
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-64 mb-2" />
            <div className="flex space-x-2">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-5 w-24" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-5/6" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  if (!report) {
    return (
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center">
          <Button variant="ghost" size="sm" className="mr-2" onClick={() => setLocation("/reports")}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Geri
          </Button>
          <h2 className="text-3xl font-bold tracking-tight">Rapor Bulunamadı</h2>
        </div>
        
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-10">
            <FileText className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">İstenen rapor bulunamadı</h3>
            <p className="text-muted-foreground mb-4">Rapor silinmiş veya taşınmış olabilir</p>
            <Link href="/reports">
              <Button>Raporlar Sayfasına Dön</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Button variant="ghost" size="sm" className="mr-2" onClick={() => setLocation("/reports")}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Geri
          </Button>
          <h2 className="text-2xl font-bold tracking-tight">{report.title}</h2>
        </div>
        
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-1" /> Yazdır
          </Button>
          <Button variant="outline" size="sm" onClick={handleDownload}>
            <Download className="h-4 w-4 mr-1" /> İndir
          </Button>
          <Link href={`/reports/edit/${report.id}`}>
            <Button variant="outline" size="sm">
              <Edit className="h-4 w-4 mr-1" /> Düzenle
            </Button>
          </Link>
          <Link href={`/reports/send/${report.id}`}>
            <Button variant="outline" size="sm">
              <Send className="h-4 w-4 mr-1" /> Gönder
            </Button>
          </Link>
        </div>
      </div>
      
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <Badge variant="outline">
                  {reportTypeTranslations[report.reportType] || report.reportType}
                </Badge>
                <Badge className={reportStatusMap[report.status]?.color || "bg-gray-100"}>
                  <span className="flex items-center">
                    {reportStatusMap[report.status]?.icon}
                    {reportStatusMap[report.status]?.label || report.status}
                  </span>
                </Badge>
              </div>
              <div className="text-sm text-muted-foreground space-y-1">
                <div>Oluşturulma: {report.createdAt && format(new Date(report.createdAt), 'dd.MM.yyyy HH:mm')}</div>
                {report.updatedAt && report.updatedAt !== report.createdAt && (
                  <div>Güncellenme: {format(new Date(report.updatedAt), 'dd.MM.yyyy HH:mm')}</div>
                )}
                {report.projectId && (
                  <div>Proje: {getProjectName(report.projectId)}</div>
                )}
                {report.location && (
                  <div>Konum: {report.location}</div>
                )}
              </div>
            </div>
          </div>
        </CardHeader>
        
        <Separator />
        
        <CardContent className="pt-6">
          <div className="space-y-4">
            <CardTitle className="text-lg">Rapor İçeriği</CardTitle>
            <div 
              className="prose prose-sm max-w-none dark:prose-invert"
              dangerouslySetInnerHTML={{ __html: report.description || "<p>Bu rapor için içerik bulunmuyor</p>" }}
            />
          </div>
          
          {report.attachments && report.attachments.length > 0 && (
            <div className="mt-8 space-y-4">
              <CardTitle className="text-lg">Ekler</CardTitle>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {report.attachments.map((attachment, index) => (
                  <div key={index} className="border rounded-md p-3 flex items-center">
                    <FileText className="h-5 w-5 mr-2 text-blue-500" />
                    <span className="text-sm truncate">{attachment}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}