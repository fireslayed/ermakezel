import { useState, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { apiRequest } from "@/lib/queryClient";

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

import { 
  MapPinIcon,
  MapIcon,
  FileEditIcon,
  TrashIcon, 
  ClockIcon,
  SendIcon,
  Loader2Icon
} from "lucide-react";

// Kullanıcı renkleri
const USER_COLORS = [
  "bg-blue-500",
  "bg-green-500",
  "bg-purple-500",
  "bg-yellow-500",
  "bg-pink-500",
  "bg-amber-500",
  "bg-rose-500",
  "bg-emerald-500",
  "bg-indigo-500",
  "bg-sky-500",
  "bg-orange-500",
  "bg-teal-500",
];

// Kullanıcı rengini ID'sine göre belirle
const getUserColor = (userId: number) => {
  return USER_COLORS[userId % USER_COLORS.length];
};

// Tarih formatla
const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return format(date, 'dd MMM yyyy HH:mm', { locale: tr });
};

// Google Maps URL'i oluştur
const getMapUrl = (lat: number, lng: number) => {
  return `https://www.google.com/maps?q=${lat},${lng}`;
};

// Kullanıcı baş harflerini al
const getUserInitials = (userId: number) => {
  // Kullanıcı adını al
  const name = getUserName(userId);
  // Boşluklardan böl ve her kelimenin ilk harfini al
  const initials = name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase();
  return initials.substring(0, 2); // En fazla 2 harf
};

// Kullanıcı adını ID'ye göre döndür
const getUserName = (userId: number) => {
  // Gerçek uygulamada kullanıcı verilerinden gelmeli
  return `Kullanıcı ${userId}`;
};

export default function LocationReportPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingReport, setEditingReport] = useState<any | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  
  // Form durumu
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [gpsLat, setGpsLat] = useState<number | null>(null);
  const [gpsLong, setGpsLong] = useState<number | null>(null);
  
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
  } = useQuery({
    queryKey: ['/api/location-reports'],
    retry: false
  });
  
  // Admin için tüm kullanıcıların bildirimlerini al
  const { 
    data: allReports, 
    isLoading: allReportsLoading 
  } = useQuery({
    queryKey: ['/api/admin/location-reports'],
    retry: false,
    enabled: true, // Sadece admin görüntüleyebilir (ID=1)
  });
  
  // Kullanıcıları al
  const { data: users } = useQuery({
    queryKey: ['/api/users'],
    retry: false
  });
  
  // Mevcut kullanıcıyı al
  const { data: currentUser } = useQuery({
    queryKey: ['/api/auth/me'],
    retry: false
  });
  
  // Yer bildirimi oluştur
  const createMutation = useMutation({
    mutationFn: (data: { location: string; description: string, gpsLat: number | null; gpsLong: number | null; reportDate: string }) => {
      return apiRequest("POST", "/api/location-reports", data);
    },
    onSuccess: () => {
      toast({
        title: "Bildirim gönderildi",
        description: "Yer bildirimi başarıyla kaydedildi.",
      });
      
      // Form alanlarını temizle
      resetForm();
      
      // Veriyi yenile
      queryClient.invalidateQueries({ queryKey: ['/api/location-reports'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/location-reports'] });
      queryClient.invalidateQueries({ queryKey: ['/api/location-reports/today'] });
      
      // Sohbet alanının sonuna kaydır
      setTimeout(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    },
    onError: (error) => {
      toast({
        title: "Hata",
        description: "Yer bildirimi kaydedilemedi. Lütfen tekrar deneyin.",
        variant: "destructive",
      });
      console.error("Create location report error:", error);
    }
  });
  
  // Yer bildirimi güncelle
  const updateMutation = useMutation({
    mutationFn: (data: { id: number; location: string; description: string, gpsLat: number | null; gpsLong: number | null; }) => {
      return apiRequest("PUT", `/api/location-reports/${data.id}`, data);
    },
    onSuccess: () => {
      toast({
        title: "Bildirim güncellendi",
        description: "Yer bildirimi başarıyla güncellendi.",
      });
      
      // Form alanlarını temizle
      resetForm();
      
      // Veriyi yenile
      queryClient.invalidateQueries({ queryKey: ['/api/location-reports'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/location-reports'] });
    },
    onError: (error) => {
      toast({
        title: "Hata",
        description: "Yer bildirimi güncellenemedi. Lütfen tekrar deneyin.",
        variant: "destructive",
      });
      console.error("Update location report error:", error);
    }
  });
  
  // Yer bildirimi sil
  const deleteMutation = useMutation({
    mutationFn: (id: number) => {
      return apiRequest("DELETE", `/api/location-reports/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Bildirim silindi",
        description: "Yer bildirimi başarıyla silindi.",
      });
      
      // Veriyi yenile
      queryClient.invalidateQueries({ queryKey: ['/api/location-reports'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/location-reports'] });
      queryClient.invalidateQueries({ queryKey: ['/api/location-reports/today'] });
    },
    onError: (error) => {
      toast({
        title: "Hata",
        description: "Yer bildirimi silinemedi. Lütfen tekrar deneyin.",
        variant: "destructive",
      });
      console.error("Delete location report error:", error);
    }
  });
  
  // Form gönderimi
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!location.trim()) {
      toast({
        title: "Hata",
        description: "Lütfen konum bilgisini girin.",
        variant: "destructive",
      });
      return;
    }
    
    if (editingReport) {
      updateMutation.mutate({
        id: editingReport.id,
        location,
        description,
        gpsLat,
        gpsLong
      });
    } else {
      createMutation.mutate({
        location,
        description,
        gpsLat,
        gpsLong,
        reportDate: new Date().toISOString() // ISO string formatında gönder
      });
    }
  };
  
  // Formu sıfırla
  const resetForm = () => {
    setEditingReport(null);
    setLocation("");
    setDescription("");
    setGpsLat(null);
    setGpsLong(null);
  };
  
  // Ters coğrafi kodlama (GPS'ten şehir/ülke bilgisi alma)
  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      // OpenStreetMap Nominatim API'sini kullanıyoruz (ücretsiz ve API key gerektirmez)
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`);
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      // Ülke ve şehir bilgisini al
      const city = data.address.city || data.address.town || data.address.village || data.address.county || '';
      const country = data.address.country || '';
      
      // Konum bilgisini oluştur
      return `${city}, ${country}`.trim();
    } catch (error) {
      console.error("Konum bilgisi alınamadı:", error);
      return null;
    }
  };
  
  // Lokasyon erişimi için tarayıcı API'sini kullan
  const getGeoLocation = () => {
    if (navigator.geolocation) {
      toast({
        title: "Konum alınıyor",
        description: "Lütfen bekleyin...",
      });
      
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          
          setGpsLat(lat);
          setGpsLong(lng);
          
          // Ters coğrafi kodlama ile şehir/ülke bilgisini al
          const locationName = await reverseGeocode(lat, lng);
          if (locationName) {
            setLocation(locationName);
            toast({
              title: "Konum alındı",
              description: `${locationName} (GPS: ${lat.toFixed(6)}, ${lng.toFixed(6)})`,
            });
          } else {
            toast({
              title: "Konum alındı",
              description: `GPS: ${lat.toFixed(6)}, ${lng.toFixed(6)}`,
            });
          }
        },
        (error) => {
          console.error("Geolocation error:", error);
          toast({
            title: "Konum alınamadı",
            description: "GPS koordinatları alınamadı. Lütfen konum bilgisini manuel olarak giriniz.",
            variant: "destructive"
          });
        }
      );
    } else {
      toast({
        title: "Konum alınamadı",
        description: "Tarayıcınız konum erişimini desteklemiyor. Lütfen konum bilgisini manuel olarak giriniz.",
        variant: "destructive"
      });
    }
  };
  
  // Bildirimi düzenle
  const handleEditReport = (report: any) => {
    setEditingReport(report);
    setLocation(report.location);
    setDescription(report.description || "");
    setGpsLat(report.gpsLat);
    setGpsLong(report.gpsLong);
  };
  
  // Bildirimi sil
  const handleDeleteReport = (id: number) => {
    if (window.confirm("Bu yer bildirimini silmek istediğinizden emin misiniz?")) {
      deleteMutation.mutate(id);
    }
  };

  // Yükleme durumundaysa
  if (allReportsLoading || reportsLoading) {
    return (
      <div className="container max-w-2xl mx-auto px-4 py-3">
        <Card className="flex flex-col">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg">Yer Bildirimi</CardTitle>
              <Badge variant="outline">
                <ClockIcon className="mr-1 h-3 w-3" />
                {format(new Date(), 'dd MMMM yyyy', { locale: tr })}
              </Badge>
            </div>
          </CardHeader>
          <Separator />
          <CardContent className="py-3">
            <div className="flex flex-col space-y-4 animate-pulse">
              <div className="h-12 bg-muted rounded-md w-3/4"></div>
              <div className="h-12 bg-muted rounded-md w-2/3 ml-auto"></div>
              <div className="h-12 bg-muted rounded-md w-3/4"></div>
            </div>
          </CardContent>
          <Separator />
          <CardFooter className="py-3">
            <div className="w-full flex gap-2">
              <div className="flex-1 h-10 bg-muted rounded-md"></div>
              <div className="w-10 h-10 bg-muted rounded-md"></div>
            </div>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Filtrelenmiş raporları al
  const filteredReports = allReports || reports || [];
  
  return (
    <div className="container max-w-2xl mx-auto px-4 py-3">
      <Card className="flex flex-col">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg">Yer Bildirimi</CardTitle>
            <Badge variant="outline">
              <ClockIcon className="mr-1 h-3 w-3" />
              {format(new Date(), 'dd MMMM yyyy', { locale: tr })}
            </Badge>
          </div>
        </CardHeader>
        
        <Separator />
        
        <CardContent className="py-3 overflow-y-auto max-h-[65vh]">
          <div className="space-y-3">
            {filteredReports.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 text-center">
                <MapPinIcon className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-muted-foreground">Henüz yer bildirimi bulunmuyor.</p>
              </div>
            ) : (
              filteredReports.map((report: any) => {
                const isCurrentUser = currentUser?.id === report.userId;
                const backgroundColor = getUserColor(report.userId);
                const userInitials = getUserInitials(report.userId);
                const userName = report.user?.fullName || getUserName(report.userId);
                
                return (
                  <div 
                    key={report.id} 
                    className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`flex ${isCurrentUser ? 'flex-row-reverse' : 'flex-row'} gap-2 max-w-[80%]`}>
                      {!isCurrentUser && (
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className={`${backgroundColor} text-white text-xs`}>
                            {userInitials}
                          </AvatarFallback>
                        </Avatar>
                      )}
                      
                      <div>
                        {!isCurrentUser && (
                          <div className="mb-1 text-xs font-medium">{userName}</div>
                        )}
                        
                        <div 
                          className={`rounded-lg p-3 ${
                            isCurrentUser 
                              ? 'bg-primary text-primary-foreground' 
                              : 'bg-muted'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <div className="font-medium">{report.location}</div>
                            <span className="text-xs opacity-70">
                              {format(new Date(report.reportDate), 'HH:mm')}
                            </span>
                          </div>
                          
                          {report.description && (
                            <p className="text-sm">{report.description}</p>
                          )}
                          
                          {report.gpsLat !== null && report.gpsLong !== null && (
                            <div className="flex items-center justify-between mt-1">
                              <span className={`text-xs ${isCurrentUser ? 'text-blue-100' : 'text-muted-foreground'}`}>
                                GPS: {report.gpsLat !== null ? Number(report.gpsLat).toFixed(6) : "N/A"}, {report.gpsLong !== null ? Number(report.gpsLong).toFixed(6) : "N/A"}
                              </span>
                              
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <a 
                                      href={report.gpsLat !== null && report.gpsLong !== null ? getMapUrl(Number(report.gpsLat), Number(report.gpsLong)) : "#"} 
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className={`p-1 rounded hover:bg-black/10 ${isCurrentUser ? 'text-white' : ''}`}
                                    >
                                      <MapIcon className="h-4 w-4" />
                                    </a>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Haritada Görüntüle</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                          )}
                          
                          {(isCurrentUser || currentUser?.isAdmin) && (
                            <div className="flex justify-end gap-1 mt-2">
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button 
                                      variant="ghost" 
                                      size="icon" 
                                      className={`h-6 w-6 ${isCurrentUser ? 'text-blue-100 hover:text-white hover:bg-blue-600' : ''}`}
                                      onClick={() => handleEditReport(report)}
                                    >
                                      <FileEditIcon className="h-3 w-3" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Düzenle</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                              
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button 
                                      variant="ghost" 
                                      size="icon" 
                                      className={`h-6 w-6 ${isCurrentUser ? 'text-blue-100 hover:text-white hover:bg-blue-600' : ''}`}
                                      onClick={() => handleDeleteReport(report.id)}
                                    >
                                      <TrashIcon className="h-3 w-3" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Sil</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                          )}
                        </div>
                        
                        <div className="text-xs text-muted-foreground mt-1">
                          {formatDate(report.reportDate)}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
            <div ref={chatEndRef} />
          </div>
        </CardContent>
        
        <Separator />
        
        <CardFooter className="py-3">
          <form onSubmit={handleSubmit} className="flex gap-2 w-full">
            <div className="flex-1">
              <div className="relative">
                <Input
                  placeholder="Konumunuzu girin..."
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  required
                  className="pr-10"
                />
                <Button 
                  type="button" 
                  size="icon" 
                  variant="ghost" 
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7" 
                  onClick={getGeoLocation}
                >
                  <MapPinIcon className="h-4 w-4" />
                </Button>
              </div>
              
              {todayReport ? (
                <div className="text-xs text-muted-foreground mt-1">
                  Bugün için zaten bir bildirim yapıldı. Yeni bildirim eklemek ister misiniz?
                </div>
              ) : null}
            </div>
            
            <Button 
              type="submit" 
              disabled={createMutation.isPending || !location.trim()}
            >
              {createMutation.isPending ? (
                <Loader2Icon className="h-4 w-4 animate-spin" />
              ) : (
                <SendIcon className="h-4 w-4" />
              )}
            </Button>
          </form>
        </CardFooter>
        
        {/* Düzenleme Modalı */}
        {editingReport && (
          <Dialog open={!!editingReport} onOpenChange={(open) => !open && resetForm()}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Yer Bildirimi Düzenle</DialogTitle>
              </DialogHeader>
              
              <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-location">Konum *</Label>
                  <div className="flex gap-2">
                    <Input
                      id="edit-location"
                      placeholder="Örnek: İstanbul, Kadıköy"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      required
                    />
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={getGeoLocation}
                    >
                      <MapPinIcon className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="edit-description">Açıklama</Label>
                  <Textarea
                    id="edit-description"
                    placeholder="Örnek: Müşteri ziyareti / Kurulum devam ediyor"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="min-h-[100px]"
                  />
                </div>
                
                {(gpsLat !== null && gpsLong !== null) && (
                  <div className="space-y-2">
                    <Label>GPS Koordinatları</Label>
                    <div className="flex justify-between items-center rounded border p-2 text-sm">
                      <span>{gpsLat.toFixed(6)}, {gpsLong.toFixed(6)}</span>
                      <a 
                        href={getMapUrl(gpsLat, gpsLong)} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:underline"
                      >
                        <MapIcon className="h-4 w-4" />
                      </a>
                    </div>
                  </div>
                )}
                
                <div className="flex justify-end gap-2 pt-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={resetForm}
                  >
                    İptal
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={updateMutation.isPending}
                  >
                    {updateMutation.isPending ? (
                      <div className="flex items-center">
                        <Loader2Icon className="h-4 w-4 animate-spin mr-2" />
                        Güncelleniyor
                      </div>
                    ) : (
                      "Güncelle"
                    )}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </Card>
    </div>
  );
}