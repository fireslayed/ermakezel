import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { CKEditor } from "@ckeditor/ckeditor5-react";
import ClassicEditor from "@ckeditor/ckeditor5-build-classic";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

import {
  FileText,
  Send,
  MoreVertical,
  Plus,
  Edit,
  Trash2,
  Filter,
  CheckCircle,
  Clock,
  AlertCircle,
} from "lucide-react";

// Rapor türleri
const reportTypes = [
  { id: "daily", name: "Günlük Rapor" },
  { id: "installation", name: "Kurulum Raporu" },
  { id: "maintenance", name: "Bakım Raporu" },
  { id: "inspection", name: "Denetim Raporu" },
  { id: "incident", name: "Olay Raporu" },
  { id: "production", name: "Üretim Raporu" },
];

// Rapor durum bilgileri
const reportStatusMap = {
  "draft": { label: "Taslak", color: "bg-yellow-500", icon: <Clock className="h-3 w-3 mr-1" /> },
  "sent": { label: "Gönderildi", color: "bg-green-500", icon: <CheckCircle className="h-3 w-3 mr-1" /> },
  "pending": { label: "İşlemde", color: "bg-blue-500", icon: <Clock className="h-3 w-3 mr-1" /> },
  "rejected": { label: "Reddedildi", color: "bg-red-500", icon: <AlertCircle className="h-3 w-3 mr-1" /> },
}

// Durum bileşeni
function StatusBadge({ status }: { status: string }) {
  const statusInfo = reportStatusMap[status as keyof typeof reportStatusMap] || reportStatusMap.draft;
  
  return (
    <Badge className={`${statusInfo.color} text-white flex items-center`}>
      {statusInfo.icon}
      {statusInfo.label}
    </Badge>
  );
}

interface ReportFormProps {
  defaultValues?: any;
  onSubmit: (data: any) => void;
  projects: any[];
  isSubmitting: boolean;
}

function ReportForm({ defaultValues, onSubmit, projects, isSubmitting }: ReportFormProps) {
  const [formData, setFormData] = useState({
    title: defaultValues?.title || "",
    location: defaultValues?.location || "",
    description: defaultValues?.description || "",
    status: defaultValues?.status || "draft",
    projectId: defaultValues?.projectId?.toString() || "",
    reportType: defaultValues?.reportType || "daily",
    files: defaultValues?.files || [],
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  // CKEditor değişiklikleri için özel işleyici
  const handleEditorChange = (data: string) => {
    setFormData(prev => ({ ...prev, description: data }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Verileri düzenle (projectId için number dönüşümü yapılıyor)
    const submissionData = {
      ...formData,
      projectId: formData.projectId ? parseInt(formData.projectId) : null,
    };
    
    onSubmit(submissionData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Rapor Başlığı</Label>
        <Input
          id="title"
          name="title"
          value={formData.title}
          onChange={handleChange}
          placeholder="Rapor başlığını girin"
          required
        />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="reportType">Rapor Türü</Label>
          <Select 
            value={formData.reportType} 
            onValueChange={(value) => handleSelectChange("reportType", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Rapor türünü seçin" />
            </SelectTrigger>
            <SelectContent>
              {reportTypes.map(type => (
                <SelectItem key={type.id} value={type.id}>{type.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="projectId">İlgili Proje</Label>
          <Select 
            value={formData.projectId} 
            onValueChange={(value) => handleSelectChange("projectId", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Proje seçin (opsiyonel)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0">Proje Yok</SelectItem>
              {projects.map(project => (
                <SelectItem key={project.id} value={project.id.toString()}>{project.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="location">Konum</Label>
        <Input
          id="location"
          name="location"
          value={formData.location}
          onChange={handleChange}
          placeholder="Rapor konumunu girin (opsiyonel)"
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="description">Açıklama</Label>
        <div className="min-h-[200px] border rounded-md overflow-hidden">
          <CKEditor
            editor={ClassicEditor}
            data={formData.description || ""}
            onChange={(event, editor) => {
              const data = editor.getData();
              handleEditorChange(data);
            }}
            config={{
              toolbar: ['heading', '|', 'bold', 'italic', 'link', 'bulletedList', 'numberedList', '|', 'outdent', 'indent', '|', 'blockQuote', 'insertTable', 'undo', 'redo'],
              language: 'tr',
              placeholder: "Rapor detaylarını girin (zengin metin düzenleme özelliklerini kullanabilirsiniz)"
            }}
          />
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="status">Durum</Label>
        <Select 
          value={formData.status} 
          onValueChange={(value) => handleSelectChange("status", value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Rapor durumunu seçin" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="draft">Taslak</SelectItem>
            <SelectItem value="pending">İşlemde</SelectItem>
            <SelectItem value="sent">Gönderildi</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      {/* Dosya yükleme (ileri versiyonlarda eklenecek) */}
      <div className="space-y-2">
        <Label>Dosyalar</Label>
        <div className="p-4 border border-dashed rounded-md text-center text-muted-foreground">
          <p>Dosya yükleme özelliği yakında eklenecek</p>
        </div>
      </div>
      
      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Kaydediliyor..." : defaultValues ? "Raporu Güncelle" : "Raporu Kaydet"}
      </Button>
    </form>
  );
}

// Email gönderme modal formu
function SendReportForm({ reportId, onSend, isSending }: { reportId: number, onSend: (emailTo: string) => void, isSending: boolean }) {
  const [email, setEmail] = useState("");
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSend(email);
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="emailTo">Alıcı E-posta</Label>
        <Input
          id="emailTo"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="ornek@sirket.com"
          type="email"
          required
        />
      </div>
      
      <DialogFooter>
        <DialogClose asChild>
          <Button variant="outline">İptal</Button>
        </DialogClose>
        <Button type="submit" disabled={isSending}>
          {isSending ? "Gönderiliyor..." : "Gönder"}
        </Button>
      </DialogFooter>
    </form>
  );
}

export default function Reports() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isSendOpen, setIsSendOpen] = useState(false);
  const [currentReport, setCurrentReport] = useState<any>(null);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Raporları getir
  const { data: reports, isLoading: isLoadingReports } = useQuery({
    queryKey: ['/api/reports'],
  });
  
  // Projeleri getir (rapor formunda kullanılacak)
  const { data: projects = [] } = useQuery({
    queryKey: ['/api/projects'],
  });
  
  // Rapor oluşturma mutasyonu
  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/reports", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/reports'] });
      setIsCreateOpen(false);
      toast({
        title: "Başarılı",
        description: "Rapor başarıyla oluşturuldu",
      });
    },
    onError: (error) => {
      toast({
        title: "Hata",
        description: "Rapor oluşturulamadı: " + error.message,
        variant: "destructive",
      });
    }
  });
  
  // Rapor güncelleme mutasyonu
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: any }) => {
      const res = await apiRequest("PATCH", `/api/reports/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/reports'] });
      setIsEditOpen(false);
      toast({
        title: "Başarılı",
        description: "Rapor başarıyla güncellendi",
      });
    },
    onError: (error) => {
      toast({
        title: "Hata",
        description: "Rapor güncellenemedi: " + error.message,
        variant: "destructive",
      });
    }
  });
  
  // Rapor silme mutasyonu
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/reports/${id}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/reports'] });
      toast({
        title: "Başarılı",
        description: "Rapor başarıyla silindi",
      });
    },
    onError: (error) => {
      toast({
        title: "Hata",
        description: "Rapor silinemedi: " + error.message,
        variant: "destructive",
      });
    }
  });
  
  // Rapor gönderme mutasyonu
  const sendMutation = useMutation({
    mutationFn: async ({ id, emailTo }: { id: number, emailTo: string }) => {
      const res = await apiRequest("POST", `/api/reports/${id}/send`, { emailTo });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/reports'] });
      setIsSendOpen(false);
      toast({
        title: "Başarılı",
        description: "Rapor başarıyla gönderildi",
      });
    },
    onError: (error) => {
      toast({
        title: "Hata",
        description: "Rapor gönderilemedi: " + error.message,
        variant: "destructive",
      });
    }
  });
  
  // Rapor oluşturma işleyicisi
  const handleCreateReport = (data: any) => {
    createMutation.mutate(data);
  };
  
  // Rapor güncelleme işleyicisi
  const handleUpdateReport = (data: any) => {
    if (currentReport) {
      updateMutation.mutate({ id: currentReport.id, data });
    }
  };
  
  // Rapor silme işleyicisi
  const handleDeleteReport = (report: any) => {
    if (window.confirm("Bu raporu silmek istediğinizden emin misiniz?")) {
      deleteMutation.mutate(report.id);
    }
  };
  
  // Rapor düzenleme işleyicisi
  const handleEditReport = (report: any) => {
    setCurrentReport(report);
    setIsEditOpen(true);
  };
  
  // Rapor gönderme işleyicisi
  const handleSendReport = (report: any) => {
    setCurrentReport(report);
    setIsSendOpen(true);
  };
  
  // E-posta gönderme işleyicisi
  const handleSendEmail = (emailTo: string) => {
    if (currentReport) {
      sendMutation.mutate({ id: currentReport.id, emailTo });
    }
  };
  
  // Rapor türünün adını getir
  const getReportTypeName = (typeId: string) => {
    const reportType = reportTypes.find(type => type.id === typeId);
    return reportType ? reportType.name : typeId;
  };
  
  // Projenin adını getir
  const getProjectName = (projectId: number) => {
    const project = projects.find((p: any) => p.id === projectId);
    return project ? project.name : "Proje Yok";
  };
  
  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Raporlar</h1>
          <p className="text-muted-foreground">
            Günlük, bakım ve kurulum raporlarınızı yönetin
          </p>
        </div>
        
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center">
              <Plus className="mr-2 h-4 w-4" />
              Yeni Rapor
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Yeni Rapor Oluştur</DialogTitle>
              <DialogDescription>
                Yeni bir rapor oluşturmak için aşağıdaki formu doldurun
              </DialogDescription>
            </DialogHeader>
            <ReportForm 
              onSubmit={handleCreateReport} 
              projects={projects}
              isSubmitting={createMutation.isPending} 
            />
          </DialogContent>
        </Dialog>
      </div>
      
      <Card>
        <CardHeader className="pb-3">
          <div className="flex justify-between items-center">
            <CardTitle>Tüm Raporlar</CardTitle>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" className="h-8 flex items-center">
                <Filter className="mr-2 h-4 w-4" />
                Filtrele
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoadingReports ? (
            <div className="space-y-2">
              {Array(5).fill(null).map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-[250px]" />
                    <Skeleton className="h-4 w-[200px]" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Başlık</TableHead>
                    <TableHead>Tür</TableHead>
                    <TableHead>Proje</TableHead>
                    <TableHead>Tarih</TableHead>
                    <TableHead>Durum</TableHead>
                    <TableHead className="text-right">İşlemler</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reports && reports.length > 0 ? (
                    reports.map((report: any) => (
                      <TableRow key={report.id}>
                        <TableCell className="font-medium">{report.title}</TableCell>
                        <TableCell>{getReportTypeName(report.reportType)}</TableCell>
                        <TableCell>
                          {report.projectId ? getProjectName(report.projectId) : "—"}
                        </TableCell>
                        <TableCell>
                          {format(new Date(report.createdAt), "dd MMM yyyy", { locale: tr })}
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={report.status} />
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Menüyü aç</span>
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEditReport(report)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Düzenle
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleSendReport(report)}>
                                <Send className="mr-2 h-4 w-4" />
                                E-posta Gönder
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleDeleteReport(report)}
                                className="text-red-600"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Sil
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center">
                        Henüz rapor bulunmuyor
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Düzenleme Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Raporu Düzenle</DialogTitle>
            <DialogDescription>
              Rapor bilgilerini düzenleyin
            </DialogDescription>
          </DialogHeader>
          {currentReport && (
            <ReportForm 
              defaultValues={currentReport}
              onSubmit={handleUpdateReport}
              projects={projects}
              isSubmitting={updateMutation.isPending}
            />
          )}
        </DialogContent>
      </Dialog>
      
      {/* Rapor Gönderme Dialog */}
      <Dialog open={isSendOpen} onOpenChange={setIsSendOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Raporu E-posta ile Gönder</DialogTitle>
            <DialogDescription>
              Raporunuzu e-posta ile göndermek istediğiniz kişinin adresini girin
            </DialogDescription>
          </DialogHeader>
          <SendReportForm 
            reportId={currentReport?.id || 0}
            onSend={handleSendEmail}
            isSending={sendMutation.isPending}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}