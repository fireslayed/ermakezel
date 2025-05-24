import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { apiRequest } from "@/lib/queryClient";

import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { PageHeader } from "@/components/page-header";
import { Label } from "@/components/ui/label";
import { ExportButtons } from "@/components/export-buttons";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";

import { 
  CalendarIcon,
  MapPinIcon, 
  ListIcon,
  FileEditIcon,
  TrashIcon, 
  RotateCcwIcon 
} from "lucide-react";

// Yer bildirimi tipi
interface LocationReport {
  id: number;
  userId: number;
  reportDate: string;
  location: string;
  description: string | null;
  gpsLat: number | null;
  gpsLong: number | null;
  createdAt: string;
  updatedAt: string;
}

export default function LocationReportPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("form");
  const [editingReport, setEditingReport] = useState<LocationReport | null>(null);
  
  // Form durumu
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  
  // Bugünkü yer bildirimini al
  const { 
    data: todayReport, 
    isLoading: todayLoading 
  } = useQuery({
    queryKey: ['/api/location-reports/today'],
    retry: false
  });
  
  // Tüm yer bildirimlerini al
  const { 
    data: reports, 
    isLoading: reportsLoading 
  } = useQuery<LocationReport[]>({
    queryKey: ['/api/location-reports'],
    retry: false
  });
  
  // Yer bildirimi oluşturma
  const createMutation = useMutation({
    mutationFn: (data: { location: string; description: string }) => {
      return apiRequest('/api/location-reports', 'POST', data);
    },
    onSuccess: () => {
      toast({
        title: "Başarılı!",
        description: "Yer bildirimi kaydedildi.",
      });
      setLocation("");
      setDescription("");
      // Verileri güncelle
      queryClient.invalidateQueries({ queryKey: ['/api/location-reports'] });
      queryClient.invalidateQueries({ queryKey: ['/api/location-reports/today'] });
      setActiveTab("list");
    },
    onError: (error: any) => {
      toast({
        title: "Hata!",
        description: error.message || "Yer bildirimi kaydedilemedi.",
        variant: "destructive"
      });
    }
  });
  
  // Yer bildirimi güncelleme
  const updateMutation = useMutation({
    mutationFn: (data: { id: number; location: string; description: string }) => {
      return apiRequest(`/api/location-reports/${data.id}`, 'PUT', { 
        location: data.location, 
        description: data.description 
      });
    },
    onSuccess: () => {
      toast({
        title: "Başarılı!",
        description: "Yer bildirimi güncellendi.",
      });
      setLocation("");
      setDescription("");
      setEditingReport(null);
      // Verileri güncelle
      queryClient.invalidateQueries({ queryKey: ['/api/location-reports'] });
      queryClient.invalidateQueries({ queryKey: ['/api/location-reports/today'] });
      setActiveTab("list");
    },
    onError: (error: any) => {
      toast({
        title: "Hata!",
        description: error.message || "Yer bildirimi güncellenemedi.",
        variant: "destructive"
      });
    }
  });
  
  // Yer bildirimi silme
  const deleteMutation = useMutation({
    mutationFn: (id: number) => {
      return apiRequest(`/api/location-reports/${id}`, 'DELETE');
    },
    onSuccess: () => {
      toast({
        title: "Başarılı!",
        description: "Yer bildirimi silindi.",
      });
      // Verileri güncelle
      queryClient.invalidateQueries({ queryKey: ['/api/location-reports'] });
      queryClient.invalidateQueries({ queryKey: ['/api/location-reports/today'] });
    },
    onError: (error: any) => {
      toast({
        title: "Hata!",
        description: error.message || "Yer bildirimi silinemedi.",
        variant: "destructive"
      });
    }
  });
  
  // Rapor düzenleme formunu doldur
  const handleEditReport = (report: LocationReport) => {
    setEditingReport(report);
    setLocation(report.location);
    setDescription(report.description || "");
    setActiveTab("form");
  };
  
  // Formu gönder
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!location.trim()) {
      toast({
        title: "Hata!",
        description: "Lütfen konum bilgisi giriniz.",
        variant: "destructive"
      });
      return;
    }
    
    if (editingReport) {
      updateMutation.mutate({
        id: editingReport.id,
        location,
        description
      });
    } else {
      createMutation.mutate({
        location,
        description
      });
    }
  };
  
  // Formu sıfırla
  const resetForm = () => {
    setEditingReport(null);
    setLocation("");
    setDescription("");
  };
  
  // Lokasyon erişimi için tarayıcı API'sini kullan (opsiyonel)
  const getGeoLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          toast({
            title: "Konum alındı",
            description: "GPS koordinatları alındı, ancak şehir bilgisini manuel olarak giriniz.",
          });
        },
        (error) => {
          toast({
            title: "Konum alınamadı",
            description: "GPS koordinatları alınamadı. Lütfen konum bilgisini manuel olarak giriniz.",
          });
        }
      );
    } else {
      toast({
        title: "Konum desteği yok",
        description: "Tarayıcınız konum desteği sunmuyor. Lütfen konum bilgisini manuel olarak giriniz.",
      });
    }
  };
  
  // Kullanıcıya bugünkü raporunu yapıp yapmadığını kontrol ederek uyarı göster
  useEffect(() => {
    const checkTodayReport = () => {
      if (todayReport === null && !todayLoading) {
        toast({
          title: "Günlük Yer Bildirimi",
          description: "Bugün için henüz yer bildirimi yapmadınız. Lütfen günlük yer bildiriminizi yapınız.",
        });
      }
    };
    
    // Sayfa yüklendiğinde kontrol et
    checkTodayReport();
    
    // Her 2 saatte bir kontrol et (opsiyonel)
    const interval = setInterval(checkTodayReport, 2 * 60 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [todayReport, todayLoading, toast]);
  
  return (
    <div className="container mx-auto py-6">
      <PageHeader
        heading="Yer Bildirimi Sistemi"
        text="Günlük yer bildirimi yapabilir ve geçmiş bildirimlerinizi görüntüleyebilirsiniz."
        icon={<MapPinIcon className="h-6 w-6" />}
      >
        {!todayLoading && !todayReport && (
          <Alert className="mt-4 border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
            <CalendarIcon className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
            <AlertTitle>Bildirim Yapmadınız</AlertTitle>
            <AlertDescription>
              Bugün için henüz yer bildirimi yapmadınız. Lütfen günlük yer bildiriminizi yapınız.
            </AlertDescription>
          </Alert>
        )}
      </PageHeader>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="form">
            {editingReport ? "Yer Bildirimini Düzenle" : "Yeni Yer Bildirimi"}
          </TabsTrigger>
          <TabsTrigger value="list">Yer Bildirimi Geçmişi</TabsTrigger>
        </TabsList>
        
        <TabsContent value="form" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>
                {editingReport ? "Yer Bildirimini Düzenle" : "Yeni Yer Bildirimi"}
              </CardTitle>
              <CardDescription>
                Günlük yer bildiriminizi buradan yapabilirsiniz. Her gün en az bir kere bildirim yapmanız gerekmektedir.
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="location">Konum *</Label>
                  <div className="flex gap-2">
                    <Input
                      id="location"
                      placeholder="Örnek: İstanbul, Kadıköy"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      required
                    />
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={getGeoLocation}
                      title="GPS ile konum al (şehir bilgisini manuel girmeniz gerekir)"
                    >
                      <MapPinIcon className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description">Açıklama</Label>
                  <Textarea
                    id="description"
                    placeholder="Örnek: Müşteri ziyareti / Kurulum devam ediyor"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="min-h-[100px]"
                  />
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={resetForm}
                >
                  <RotateCcwIcon className="mr-2 h-4 w-4" />
                  {editingReport ? "İptal" : "Temizle"}
                </Button>
                <Button 
                  type="submit" 
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {createMutation.isPending || updateMutation.isPending ? (
                    <div className="flex items-center">
                      <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                      Kaydediliyor...
                    </div>
                  ) : (
                    <>
                      {editingReport ? "Güncelle" : "Kaydet"}
                    </>
                  )}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>
        
        <TabsContent value="list" className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Yer Bildirimi Geçmişi</CardTitle>
                {reports && reports.length > 0 && (
                  <ExportButtons 
                    data={reports} 
                    fileName="yer-bildirimleri" 
                    pdfTitle="Yer Bildirimleri Raporu"
                  />
                )}
              </div>
              <CardDescription>
                Geçmiş yer bildirimlerinizi görüntüleyebilirsiniz.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {reportsLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : !reports || reports.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-muted-foreground">Henüz yer bildirimi yapılmamış.</p>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableCaption>Yer bildirimi geçmişiniz</TableCaption>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tarih</TableHead>
                        <TableHead>Konum</TableHead>
                        <TableHead>Açıklama</TableHead>
                        <TableHead className="text-right">İşlemler</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reports.map((report) => (
                        <TableRow key={report.id}>
                          <TableCell className="font-medium">
                            {format(new Date(report.reportDate), 'dd MMMM yyyy', { locale: tr })}
                          </TableCell>
                          <TableCell>{report.location}</TableCell>
                          <TableCell className="max-w-[300px] truncate">
                            {report.description || "-"}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEditReport(report)}
                                title="Düzenle"
                              >
                                <FileEditIcon className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  if (window.confirm("Bu yer bildirimini silmek istediğinize emin misiniz?")) {
                                    deleteMutation.mutate(report.id);
                                  }
                                }}
                                title="Sil"
                              >
                                <TrashIcon className="h-4 w-4 text-red-500" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}