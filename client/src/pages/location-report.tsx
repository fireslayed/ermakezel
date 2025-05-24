import { useState, useEffect, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { apiRequest } from "@/lib/queryClient";

import { 
  Card, 
  CardContent,
  CardFooter,
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { PageHeader } from "@/components/page-header";
import { Label } from "@/components/ui/label";
import { ExportButtons } from "@/components/export-buttons";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

import { 
  CalendarIcon,
  MapPinIcon,
  FileEditIcon,
  TrashIcon, 
  RotateCcwIcon,
  SendIcon,
  MapIcon,
  FilterIcon,
  UserIcon,
  ClockIcon,
  CheckIcon,
  RefreshCwIcon,
  DownloadIcon,
  Loader2Icon
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
  user?: {
    id: number;
    username: string;
    fullName: string;
  };
}

// Kullanıcı tipi
interface User {
  id: number;
  username: string;
  fullName: string;
}

// Kullanıcı renkleri
const USER_COLORS = [
  "bg-blue-500",
  "bg-green-500",
  "bg-purple-500",
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

export default function LocationReportPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("chat");
  const [editingReport, setEditingReport] = useState<LocationReport | null>(null);
  const [showMap, setShowMap] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  
  // Form durumu
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [gpsLat, setGpsLat] = useState<number | null>(null);
  const [gpsLong, setGpsLong] = useState<number | null>(null);
  
  // Filtre durumu
  const [dateFilter, setDateFilter] = useState<string | null>(null);
  const [userFilter, setUserFilter] = useState<number | null>(null);
  const [locationFilter, setLocationFilter] = useState<string>("");
  
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
  
  // Admin için tüm kullanıcıların bildirimlerini al
  const { 
    data: allReports, 
    isLoading: allReportsLoading 
  } = useQuery<(LocationReport & { user: User })[]>({
    queryKey: ['/api/admin/location-reports'],
    retry: false,
    enabled: true, // Sadece admin görüntüleyebilir (ID=1)
  });
  
  // Kullanıcıları al
  const { 
    data: users, 
    isLoading: usersLoading 
  } = useQuery<User[]>({
    queryKey: ['/api/users'],
    retry: false
  });
  
  // Mevcut kullanıcı
  const { 
    data: currentUser 
  } = useQuery({
    queryKey: ['/api/auth/me'],
    retry: false
  });
  
  // Yer bildirimi oluşturma
  const createMutation = useMutation({
    mutationFn: (data: { location: string; description: string, gpsLat: number | null; gpsLong: number | null; reportDate: Date }) => {
      return apiRequest('/api/location-reports', 'POST', data);
    },
    onSuccess: () => {
      toast({
        title: "Başarılı!",
        description: "Yer bildirimi kaydedildi.",
      });
      setLocation("");
      setDescription("");
      setGpsLat(null);
      setGpsLong(null);
      
      // Verileri güncelle
      queryClient.invalidateQueries({ queryKey: ['/api/location-reports'] });
      queryClient.invalidateQueries({ queryKey: ['/api/location-reports/today'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/location-reports'] });
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
    mutationFn: (data: { id: number; location: string; description: string; gpsLat: number | null; gpsLong: number | null }) => {
      return apiRequest(`/api/location-reports/${data.id}`, 'PUT', { 
        location: data.location, 
        description: data.description,
        gpsLat: data.gpsLat,
        gpsLong: data.gpsLong 
      });
    },
    onSuccess: () => {
      toast({
        title: "Başarılı!",
        description: "Yer bildirimi güncellendi.",
      });
      setLocation("");
      setDescription("");
      setGpsLat(null);
      setGpsLong(null);
      setEditingReport(null);
      
      // Verileri güncelle
      queryClient.invalidateQueries({ queryKey: ['/api/location-reports'] });
      queryClient.invalidateQueries({ queryKey: ['/api/location-reports/today'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/location-reports'] });
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
      queryClient.invalidateQueries({ queryKey: ['/api/admin/location-reports'] });
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
    setGpsLat(report.gpsLat);
    setGpsLong(report.gpsLong);
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
    
    // Tarih ekle (bugün için)
    const today = new Date().toISOString();
    
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
        reportDate: new Date()
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
        title: "Konum desteği yok",
        description: "Tarayıcınız konum desteği sunmuyor. Lütfen konum bilgisini manuel olarak giriniz.",
        variant: "destructive"
      });
    }
  };

  // Filtrelemeyi temizle
  const clearFilters = () => {
    setDateFilter(null);
    setUserFilter(null);
    setLocationFilter("");
  };
  
  // Mesajları filtrele
  const getFilteredReports = () => {
    let filtered = allReports || [];
    
    if (dateFilter) {
      const filterDate = new Date(dateFilter);
      filtered = filtered.filter(report => {
        const reportDate = new Date(report.reportDate);
        return reportDate.toDateString() === filterDate.toDateString();
      });
    }
    
    if (userFilter) {
      filtered = filtered.filter(report => report.userId === userFilter);
    }
    
    if (locationFilter) {
      filtered = filtered.filter(report => 
        report.location.toLowerCase().includes(locationFilter.toLowerCase())
      );
    }
    
    return filtered;
  };
  
  // Filtrelenmiş mesajları al
  const filteredReports = getFilteredReports();
  
  // Mesajları tarih sırasına göre sırala
  const sortedReports = [...filteredReports].sort((a, b) => 
    new Date(a.reportDate).getTime() - new Date(b.reportDate).getTime()
  );
  
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
    
    // Her 30 dakikada bir kontrol et
    const interval = setInterval(checkTodayReport, 30 * 60 * 1000);
    
    // Sabah 8:30'da özel hatırlatma
    const scheduleReminder = () => {
      const now = new Date();
      const targetTime = new Date(now);
      targetTime.setHours(8, 30, 0, 0);
      
      let delay = targetTime.getTime() - now.getTime();
      if (delay < 0) {
        // Eğer bugün için zaman geçtiyse, yarın için planla
        targetTime.setDate(targetTime.getDate() + 1);
        delay = targetTime.getTime() - now.getTime();
      }
      
      return setTimeout(() => {
        if (todayReport === null) {
          toast({
            title: "Uyarı!",
            description: "Günlük yer bildiriminizi henüz yapmadınız!",
            variant: "destructive"
          });
          // Bir sonraki günü planla
          scheduleReminder();
        }
      }, delay);
    };
    
    const reminder = scheduleReminder();
    
    return () => {
      clearInterval(interval);
      clearTimeout(reminder);
    };
  }, [todayReport, todayLoading, toast]);
  
  // Yeni mesaj geldiğinde sohbet alanını aşağı kaydır
  useEffect(() => {
    if (chatEndRef.current && sortedReports.length > 0) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [sortedReports.length]);
  
  // Kullanıcı adını bul
  const getUserName = (userId: number) => {
    const user = users?.find(u => u.id === userId);
    return user ? user.fullName : `Kullanıcı #${userId}`;
  };
  
  // Kullanıcı resminin baş harflerini al
  const getUserInitials = (userId: number) => {
    const user = users?.find(u => u.id === userId);
    if (!user) return `K${userId}`;
    
    const nameParts = user.fullName.split(' ');
    if (nameParts.length === 1) return nameParts[0].charAt(0);
    return `${nameParts[0].charAt(0)}${nameParts[nameParts.length - 1].charAt(0)}`;
  };

  // Harita URL'si oluştur
  const getMapUrl = (lat: number, lng: number) => {
    return `https://www.google.com/maps?q=${lat},${lng}`;
  };
  
  // Excel'e aktar
  const exportToExcel = () => {
    // Export işlemi
  };
  
  // Admin mi kontrol et (ID=1 ise admin)
  const isAdmin = currentUser?.id === 1;
  
  return (
    <div className="container mx-auto py-6">
      <PageHeader
        heading="Yer Bildirimi Sistemi"
        text="Günlük yer bildirimi yapabilir ve tüm ekibin bildirimlerini görüntüleyebilirsiniz."
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
          <TabsTrigger value="chat">
            WhatsApp Tarzı Yer Bildirimleri
          </TabsTrigger>
          <TabsTrigger value="map">Haritada Görüntüle</TabsTrigger>
        </TabsList>
        
        <TabsContent value="chat" className="mt-4">
          <Card className="h-[calc(100vh-280px)] flex flex-col">
            <CardHeader className="flex-none pb-3">
              <div className="flex justify-between items-center">
                <CardTitle>Ekip Konum Mesajları</CardTitle>
                
                <div className="flex items-center gap-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <FilterIcon className="mr-2 h-4 w-4" />
                        Filtrele
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Mesajları Filtrele</DialogTitle>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="date-filter">Tarihe Göre</Label>
                          <Input
                            id="date-filter"
                            type="date"
                            value={dateFilter || ''}
                            onChange={(e) => setDateFilter(e.target.value || null)}
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="user-filter">Kullanıcıya Göre</Label>
                          <Select
                            value={userFilter?.toString() || ''}
                            onValueChange={(value) => setUserFilter(value ? parseInt(value) : null)}
                          >
                            <SelectTrigger id="user-filter">
                              <SelectValue placeholder="Tüm kullanıcılar" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="">Tüm kullanıcılar</SelectItem>
                              {users?.map(user => (
                                <SelectItem key={user.id} value={user.id.toString()}>
                                  {user.fullName}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="location-filter">Konuma Göre</Label>
                          <Input
                            id="location-filter"
                            placeholder="Konum ara..."
                            value={locationFilter}
                            onChange={(e) => setLocationFilter(e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="flex justify-between">
                        <Button variant="outline" onClick={clearFilters}>
                          Filtreleri Temizle
                        </Button>
                        <Button onClick={() => {}}>
                          Uygula
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                  
                  {filteredReports.length > 0 && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="outline" size="sm" onClick={exportToExcel}>
                            <DownloadIcon className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Excel'e Aktar</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                  
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            queryClient.invalidateQueries({ queryKey: ['/api/location-reports'] });
                            queryClient.invalidateQueries({ queryKey: ['/api/admin/location-reports'] });
                            toast({
                              title: "Yenilendi",
                              description: "Yer bildirimleri güncellendi",
                            });
                          }}
                        >
                          <RefreshCwIcon className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Yenile</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
              
              {(dateFilter || userFilter || locationFilter) && (
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-sm text-muted-foreground">Aktif filtreler:</span>
                  {dateFilter && (
                    <Badge variant="outline" className="text-xs">
                      <CalendarIcon className="mr-1 h-3 w-3" />
                      {new Date(dateFilter).toLocaleDateString('tr-TR')}
                    </Badge>
                  )}
                  {userFilter && (
                    <Badge variant="outline" className="text-xs">
                      <UserIcon className="mr-1 h-3 w-3" />
                      {getUserName(userFilter)}
                    </Badge>
                  )}
                  {locationFilter && (
                    <Badge variant="outline" className="text-xs">
                      <MapPinIcon className="mr-1 h-3 w-3" />
                      {locationFilter}
                    </Badge>
                  )}
                  <Button variant="ghost" size="sm" className="h-6 px-2" onClick={clearFilters}>
                    Temizle
                  </Button>
                </div>
              )}
            </CardHeader>
            <Separator />
            
            <CardContent className="flex-grow overflow-y-auto p-4">
              {allReportsLoading ? (
                <div className="flex flex-col space-y-4">
                  <Skeleton className="h-24 w-2/3" />
                  <Skeleton className="h-24 w-2/3 ml-auto" />
                  <Skeleton className="h-24 w-2/3" />
                  <Skeleton className="h-24 w-2/3 ml-auto" />
                </div>
              ) : sortedReports.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <MapPinIcon className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Henüz yer bildirimi yapılmamış veya filtrelere uygun sonuç bulunamadı.</p>
                  {(dateFilter || userFilter || locationFilter) && (
                    <Button variant="link" onClick={clearFilters} className="mt-2">
                      Filtreleri temizle
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-6">
                  {sortedReports.map((report) => {
                    const isCurrentUser = report.userId === currentUser?.id;
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
                            <Avatar className={`${backgroundColor} mt-1`}>
                              <AvatarFallback>{userInitials}</AvatarFallback>
                            </Avatar>
                          )}
                          
                          <div 
                            className={`
                              p-3 rounded-lg shadow
                              ${isCurrentUser 
                                ? 'bg-blue-500 text-white rounded-tr-none' 
                                : 'bg-gray-100 dark:bg-gray-800 rounded-tl-none'
                              }
                            `}
                          >
                            <div className="flex justify-between items-center gap-4 mb-1">
                              <span className={`font-medium text-sm ${isCurrentUser ? 'text-blue-100' : 'text-muted-foreground'}`}>
                                {isCurrentUser ? 'Siz' : userName}
                              </span>
                              <span className={`text-xs ${isCurrentUser ? 'text-blue-100' : 'text-muted-foreground'}`}>
                                {format(new Date(report.reportDate), 'dd MMM, HH:mm', { locale: tr })}
                              </span>
                            </div>
                            
                            <div className="space-y-2">
                              <div className="flex items-center gap-1">
                                <MapPinIcon className={`h-4 w-4 ${isCurrentUser ? 'text-blue-100' : 'text-muted-foreground'}`} />
                                <span className="font-medium">{report.location}</span>
                              </div>
                              
                              {report.description && (
                                <p className="text-sm">{report.description}</p>
                              )}
                              
                              {report.gpsLat && report.gpsLong && (
                                <div className="flex items-center justify-between mt-1">
                                  <span className={`text-xs ${isCurrentUser ? 'text-blue-100' : 'text-muted-foreground'}`}>
                                    GPS: {report.gpsLat.toFixed(6)}, {report.gpsLong.toFixed(6)}
                                  </span>
                                  
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <a 
                                          href={getMapUrl(report.gpsLat, report.gpsLong)} 
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
                            </div>
                            
                            {/* Sadece root kullanıcı (ID=1) için veya kendi mesajlarını düzenleme seçeneği */}
                            {(isAdmin || isCurrentUser) && (
                              <div className={`flex justify-end gap-1 mt-2 ${isCurrentUser ? 'text-blue-100' : 'text-muted-foreground'}`}>
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6 p-0 hover:bg-black/10"
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
                                
                                {isAdmin && (
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-6 w-6 p-0 hover:bg-black/10"
                                          onClick={() => {
                                            if (window.confirm("Bu yer bildirimini silmek istediğinize emin misiniz?")) {
                                              deleteMutation.mutate(report.id);
                                            }
                                          }}
                                        >
                                          <TrashIcon className="h-3 w-3" />
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>Sil</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={chatEndRef} />
                </div>
              )}
            </CardContent>
            
            <Separator />
            
            <CardFooter className="flex-none pt-3">
              <form onSubmit={handleSubmit} className="flex w-full gap-2">
                <div className="flex-grow flex gap-2">
                  <div className="flex-grow">
                    <Input
                      placeholder="Konum bilgisi giriniz (ör: İstanbul, Kadıköy)..."
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      required
                      disabled={createMutation.isPending}
                    />
                  </div>
                  
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={getGeoLocation}
                          disabled={createMutation.isPending}
                        >
                          <MapPinIcon className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>GPS ile konum al</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
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
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Gönder</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </form>
            </CardFooter>
            
            {/* Düzenleme Modalı */}
            {editingReport && (
              <Dialog open={!!editingReport} onOpenChange={(open) => !open && resetForm()}>
                <DialogContent>
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
                            <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                            Güncelleniyor...
                          </div>
                        ) : (
                          <>Güncelle</>
                        )}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            )}
          </Card>
        </TabsContent>
        
        <TabsContent value="map" className="mt-4">
          <Card className="h-[calc(100vh-280px)] flex flex-col">
            <CardHeader className="flex-none pb-3">
              <div className="flex justify-between items-center">
                <CardTitle>Haritada Konumlar</CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">
                    <ClockIcon className="mr-1 h-3 w-3" />
                    {format(new Date(), 'dd MMMM yyyy', { locale: tr })}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <Separator />
            <CardContent className="flex-grow p-0">
              <div className="h-full flex flex-col items-center justify-center">
                <MapIcon className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-center text-muted-foreground max-w-md mb-4">
                  Harita görünümü şu anda geliştirme aşamasında. Yakında tüm konumları harita üzerinde görüntüleyebileceksiniz.
                </p>
                <Button variant="outline">
                  <MapPinIcon className="mr-2 h-4 w-4" />
                  Google Maps ile görüntüle
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}