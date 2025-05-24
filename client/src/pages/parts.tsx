import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { QRCodeSVG } from "qrcode.react";
import { z } from "zod";
import { useIsMobile } from "@/hooks/use-mobile";

import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CKEditor } from "@ckeditor/ckeditor5-react";
import ClassicEditor from "@ckeditor/ckeditor5-build-classic";

// Parça form şeması
const partSchema = z.object({
  name: z.string().min(2, "Parça adı en az 2 karakter olmalıdır"),
  partNumber: z.string().min(3, "Parça numarası en az 3 karakter olmalıdır"),
  image: z.string().optional(),
  length: z.number().optional().nullable(),
  width: z.number().optional().nullable(),
  height: z.number().optional().nullable(),
  weight: z.number().optional().nullable(),
  color: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  category: z.string().optional().nullable(),
  technicalDrawing: z.string().optional().nullable(),
});

type PartFormValues = z.infer<typeof partSchema>;

// Parça kategori listesi
const categories = [
  { id: "mechanical", name: "Mekanik" },
  { id: "electrical", name: "Elektrik" },
  { id: "electronic", name: "Elektronik" },
  { id: "hydraulic", name: "Hidrolik" },
  { id: "pneumatic", name: "Pnömatik" },
  { id: "sensor", name: "Sensör" },
  { id: "other", name: "Diğer" },
];

export default function Parts() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedPartId, setSelectedPartId] = useState<number | null>(null);
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  // Varsayılan form değerleri
  const defaultValues: PartFormValues = {
    name: "",
    partNumber: "",
    image: "",
    length: null,
    width: null,
    height: null,
    weight: null,
    color: null,
    description: "",
    category: "mechanical",
    technicalDrawing: null,
  };
  
  const [formData, setFormData] = useState<PartFormValues>(defaultValues);
  
  // Base64 formatında resim önizleme
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  // Parçaları getir
  const { data: parts, isLoading, isError } = useQuery({
    queryKey: ['/api/parts'],
    retry: 1,
  });
  
  // Parça ekle
  const addPartMutation = useMutation({
    mutationFn: async (data: PartFormValues) => {
      const res = await apiRequest("POST", "/api/parts", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/parts'] });
      toast({
        title: "Başarılı",
        description: "Parça başarıyla eklendi",
      });
      resetForm();
      setOpenAddDialog(false);
    },
    onError: (error: any) => {
      toast({
        title: "Hata",
        description: error.message || "Parça eklenirken bir hata oluştu",
        variant: "destructive",
      });
    },
  });
  
  // Parça güncelle
  const updatePartMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<PartFormValues> }) => {
      const res = await apiRequest("PUT", `/api/parts/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/parts'] });
      toast({
        title: "Başarılı",
        description: "Parça başarıyla güncellendi",
      });
      resetForm();
      setOpenAddDialog(false);
      setIsEditing(false);
    },
    onError: (error: any) => {
      toast({
        title: "Hata",
        description: error.message || "Parça güncellenirken bir hata oluştu",
        variant: "destructive",
      });
    },
  });
  
  // Parça sil
  const deletePartMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/parts/${id}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/parts'] });
      toast({
        title: "Başarılı",
        description: "Parça başarıyla silindi",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Hata",
        description: error.message || "Parça silinirken bir hata oluştu",
        variant: "destructive",
      });
    },
  });
  
  // Formu gönder
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Form verilerini doğrula
      const validatedData = partSchema.parse(formData);
      
      if (isEditing && selectedPartId) {
        // Parçayı güncelle
        updatePartMutation.mutate({ id: selectedPartId, data: validatedData });
      } else {
        // Yeni parça ekle
        addPartMutation.mutate(validatedData);
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        // Doğrulama hataları
        toast({
          title: "Form Hataları",
          description: error.errors.map(e => e.message).join(", "),
          variant: "destructive",
        });
      } else {
        toast({
          title: "Hata",
          description: "Form işlenirken bir hata oluştu",
          variant: "destructive",
        });
      }
    }
  };
  
  // Form girişi değişikliği
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const target = e.target;
    const name = target.name;
    const value = target.value;
    
    // Sayısal değerler için dönüşüm
    if (["length", "width", "height", "weight"].includes(name)) {
      const numericValue = value === "" ? null : parseFloat(value);
      setFormData(prev => ({ ...prev, [name]: numericValue }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    
    // Resim dosyası seçildi
    if (target instanceof HTMLInputElement && target.type === "file" && target.files && target.files[0]) {
      const file = target.files[0];
      const reader = new FileReader();
      
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setImagePreview(base64String);
        setFormData(prev => ({ ...prev, image: base64String }));
      };
      
      reader.readAsDataURL(file);
    }
  };
  
  // CKEditor değişikliği
  const handleEditorChange = (data: string) => {
    setFormData(prev => ({ ...prev, description: data }));
  };
  
  // Select değişikliği
  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  // Düzenleme modunu başlat
  const handleEdit = (part: any) => {
    setSelectedPartId(part.id);
    setFormData({
      name: part.name,
      partNumber: part.partNumber,
      image: part.image,
      length: part.length,
      width: part.width,
      height: part.height,
      weight: part.weight,
      color: part.color,
      description: part.description || "",
      category: part.category || "mechanical",
      technicalDrawing: part.technicalDrawing,
    });
    setImagePreview(part.image);
    setIsEditing(true);
    setOpenAddDialog(true);
    setPreviewMode(false);
  };
  
  // Parçayı sil
  const handleDelete = (id: number) => {
    if (window.confirm("Bu parçayı silmek istediğinizden emin misiniz?")) {
      deletePartMutation.mutate(id);
    }
  };
  
  // Formu sıfırla
  const resetForm = () => {
    setFormData(defaultValues);
    setImagePreview(null);
    setSelectedPartId(null);
    setPreviewMode(false);
  };
  
  // QR Kod oluştur ve önizle
  const generateQRPreview = () => {
    if (!formData.name || !formData.partNumber) {
      // Toast mesajını sadece kullanıcı önizleme butonuna bastığında göster
      if (previewMode) {
        toast({
          title: "Eksik Bilgi",
          description: "QR kod oluşturmak için parça adı ve numarası gereklidir",
          variant: "destructive",
        });
      }
      return;
    }
    
    const qrData = JSON.stringify({
      name: formData.name,
      partNumber: formData.partNumber,
      dimensions: formData.length || formData.width || formData.height 
        ? `${formData.length || '-'}x${formData.width || '-'}x${formData.height || '-'} mm` 
        : undefined,
      category: formData.category,
      weight: formData.weight ? `${formData.weight} gr` : undefined,
      color: formData.color || undefined,
    });
    
    return qrData;
  };
  
  return (
    <div className="flex flex-col space-y-4 p-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Parça Yönetimi</h1>
        <Button onClick={() => { resetForm(); setOpenAddDialog(true); setIsEditing(false); }}>
          Parça Ekle
        </Button>
      </div>
      
      {/* Parça Ekleme Dialog */}
      <Dialog open={openAddDialog} onOpenChange={setOpenAddDialog}>
        <DialogContent className="sm:max-w-[800px] lg:max-w-[900px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isEditing ? "Parça Düzenle" : "Yeni Parça Ekle"}</DialogTitle>
            <DialogDescription>
              {isEditing 
                ? "Parça bilgilerini güncellemek için formu düzenleyin." 
                : "Sisteme yeni bir parça eklemek için aşağıdaki formu doldurun."}
            </DialogDescription>
          </DialogHeader>
          
          <Tabs defaultValue="form" className="w-full">
            <TabsList className="grid grid-cols-2">
              <TabsTrigger value="form" onClick={() => setPreviewMode(false)}>Form</TabsTrigger>
              <TabsTrigger value="preview" onClick={() => setPreviewMode(true)}>Önizleme</TabsTrigger>
            </TabsList>
            
            <TabsContent value="form" className="p-2">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Temel Bilgiler */}
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="name">Parça Adı</Label>
                      <Input
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="Parça adını girin"
                        required
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="partNumber">Parça Numarası</Label>
                      <Input
                        id="partNumber"
                        name="partNumber"
                        value={formData.partNumber}
                        onChange={handleChange}
                        placeholder="Örn: P-00123"
                        required
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="category">Kategori</Label>
                      <Select
                        value={formData.category || ""}
                        onValueChange={(value) => handleSelectChange("category", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Kategori seçin" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((category) => (
                            <SelectItem key={category.id} value={category.id}>
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="color">Renk</Label>
                      <div className="flex space-x-2">
                        <Input
                          id="color"
                          name="color"
                          type="text"
                          value={formData.color || ""}
                          onChange={handleChange}
                          placeholder="Renk adı ya da kodu"
                          className="flex-grow"
                        />
                        <Input
                          type="color"
                          value={formData.color || "#ffffff"}
                          onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                          className="w-12 p-1 h-10"
                        />
                      </div>
                    </div>
                    
                    {/* Boyutlar */}
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <Label htmlFor="length">Uzunluk (mm)</Label>
                        <Input
                          id="length"
                          name="length"
                          type="number"
                          value={formData.length === null ? "" : formData.length}
                          onChange={handleChange}
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <Label htmlFor="width">Genişlik (mm)</Label>
                        <Input
                          id="width"
                          name="width"
                          type="number"
                          value={formData.width === null ? "" : formData.width}
                          onChange={handleChange}
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <Label htmlFor="height">Yükseklik (mm)</Label>
                        <Input
                          id="height"
                          name="height"
                          type="number"
                          value={formData.height === null ? "" : formData.height}
                          onChange={handleChange}
                          placeholder="0"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="weight">Ağırlık (gr)</Label>
                      <Input
                        id="weight"
                        name="weight"
                        type="number"
                        value={formData.weight === null ? "" : formData.weight}
                        onChange={handleChange}
                        placeholder="0"
                        step="0.01"
                      />
                    </div>
                  </div>
                  
                  {/* Görsel ve QR Kod */}
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="image">Parça Görseli</Label>
                      <Input
                        id="image"
                        name="image"
                        type="file"
                        accept="image/*"
                        onChange={handleChange}
                      />
                      {imagePreview && (
                        <div className="mt-2 border rounded-md p-2">
                          <img
                            src={imagePreview}
                            alt="Parça Önizleme"
                            className="max-h-40 object-contain mx-auto"
                          />
                        </div>
                      )}
                    </div>
                    
                    <div>
                      <Label>QR Kod Önizleme</Label>
                      <div className="p-4 border rounded-md flex flex-col items-center justify-center bg-white min-h-[150px]">
                        {formData.name && formData.partNumber ? (
                          <>
                            <QRCodeSVG
                              value={generateQRPreview() || ""}
                              size={120}
                              level="M"
                              includeMargin
                            />
                            <span className="text-xs mt-2 text-gray-500">
                              {formData.partNumber}
                            </span>
                          </>
                        ) : (
                          <p className="text-sm text-gray-500">
                            QR kod için parça adı ve numarası girin
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Açıklama - CKEditor */}
                <div className="space-y-2 w-full">
                  <Label htmlFor="description">Açıklama / Notlar</Label>
                  <div className="border rounded-md overflow-hidden w-full">
                    <div className="w-full" style={{ boxSizing: 'border-box', overflowX: 'hidden' }}>
                      <CKEditor
                        editor={ClassicEditor as any}
                        data={formData.description || ""}
                        onChange={(event: any, editor: any) => {
                          const data = editor.getData();
                          handleEditorChange(data);
                        }}
                        config={{
                          toolbar: {
                            items: [
                              "heading",
                              "|",
                              "bold",
                              "italic",
                              "link",
                              "|",
                              "bulletedList",
                              "numberedList",
                              "|",
                              "outdent",
                              "indent",
                              "|",
                              "blockQuote",
                              "insertTable",
                              "|",
                              "undo",
                              "redo",
                            ],
                            shouldNotGroupWhenFull: true
                          },
                          language: "tr",
                          placeholder: "Parça hakkında detaylı bilgi girin...",
                        }}
                      />
                    </div>
                  </div>
                </div>
                
                <DialogFooter className="flex flex-col sm:flex-row sm:justify-between gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setOpenAddDialog(false);
                      resetForm();
                    }}
                  >
                    İptal
                  </Button>
                  
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setPreviewMode(true)}
                    >
                      Önizle
                    </Button>
                    
                    <Button
                      type="submit"
                      disabled={addPartMutation.isPending || updatePartMutation.isPending}
                    >
                      {addPartMutation.isPending || updatePartMutation.isPending
                        ? "Kaydediliyor..."
                        : isEditing
                        ? "Güncelle"
                        : "Kaydet"}
                    </Button>
                  </div>
                </DialogFooter>
              </form>
            </TabsContent>
            
            <TabsContent value="preview" className="p-4 border rounded-md">
              {previewMode && (
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <h3 className="text-lg font-medium">
                      {formData.name || "Parça Adı"}
                    </h3>
                    <Badge variant="outline">{formData.partNumber || "Parça No"}</Badge>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      {/* Parça Bilgileri */}
                      <div className="space-y-2">
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                          <span className="text-sm font-medium">Kategori:</span>
                          <span className="text-sm">
                            {categories.find(c => c.id === formData.category)?.name || "-"}
                          </span>
                          
                          {(formData.length || formData.width || formData.height) && (
                            <>
                              <span className="text-sm font-medium">Boyutlar:</span>
                              <span className="text-sm">
                                {formData.length || "-"} x {formData.width || "-"} x {formData.height || "-"} mm
                              </span>
                            </>
                          )}
                          
                          {formData.weight && (
                            <>
                              <span className="text-sm font-medium">Ağırlık:</span>
                              <span className="text-sm">{formData.weight} gr</span>
                            </>
                          )}
                          
                          {formData.color && (
                            <>
                              <span className="text-sm font-medium">Renk:</span>
                              <div className="flex items-center gap-2">
                                <div 
                                  className="w-4 h-4 rounded-full border" 
                                  style={{ backgroundColor: formData.color }}
                                ></div>
                                <span className="text-sm">{formData.color}</span>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                      
                      {/* Açıklama */}
                      {formData.description && (
                        <div className="mt-4">
                          <h4 className="text-sm font-medium mb-1">Açıklama:</h4>
                          <div 
                            className="prose prose-sm max-w-none p-3 bg-muted/50 rounded-md"
                            dangerouslySetInnerHTML={{ __html: formData.description }}
                          />
                        </div>
                      )}
                    </div>
                    
                    <div className="flex flex-col gap-4">
                      {/* Görsel */}
                      {imagePreview && (
                        <div className="flex flex-col items-center">
                          <h4 className="text-sm font-medium mb-1 self-start">Görsel:</h4>
                          <div className="border rounded-md p-2 w-full flex justify-center">
                            <img
                              src={imagePreview}
                              alt={formData.name}
                              className="max-h-40 object-contain"
                            />
                          </div>
                        </div>
                      )}
                      
                      {/* QR Kod */}
                      {formData.name && formData.partNumber && (
                        <div className="flex flex-col items-center">
                          <h4 className="text-sm font-medium mb-1 self-start">QR Kod:</h4>
                          <div className="border rounded-md p-4 bg-white flex flex-col items-center">
                            <QRCodeSVG
                              value={generateQRPreview() || ""}
                              size={120}
                              level="M"
                              includeMargin
                            />
                            <span className="text-xs mt-2 text-gray-500">
                              {formData.partNumber}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Yazdırma Butonu */}
                  <div className="mt-4 flex justify-end">
                    <Button
                      variant="outline"
                      onClick={() => {
                        // Yeni pencerede yazdırma
                        const printWindow = window.open('', '_blank');
                        if (!printWindow) return;
                        
                        const qrCode = document.querySelector('.preview-qr-code svg');
                        const qrCodeSvg = qrCode ? qrCode.outerHTML : '';
                        
                        printWindow.document.write(`
                          <html>
                            <head>
                              <title>${formData.name || "Parça"} - ${formData.partNumber || ""}</title>
                              <style>
                                body { font-family: Arial, sans-serif; margin: 30px; }
                                .container { max-width: 800px; margin: 0 auto; }
                                .header { border-bottom: 1px solid #eee; padding-bottom: 10px; margin-bottom: 20px; }
                                .part-id { color: #666; }
                                .content { display: flex; gap: 30px; }
                                .details { flex: 1; }
                                .media { flex: 1; display: flex; flex-direction: column; gap: 20px; align-items: center; }
                                .qr-container { display: flex; flex-direction: column; align-items: center; }
                                .part-number { font-size: 12px; color: #666; margin-top: 5px; }
                                table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
                                th, td { text-align: left; padding: 8px; border-bottom: 1px solid #ddd; }
                                th { background-color: #f8f8f8; }
                              </style>
                            </head>
                            <body>
                              <div class="container">
                                <div class="header">
                                  <h1>${formData.name || "Parça"} <span class="part-id">${formData.partNumber || ""}</span></h1>
                                </div>
                                
                                <div class="content">
                                  <div class="details">
                                    <table>
                                      <tr>
                                        <th>Özellik</th>
                                        <th>Değer</th>
                                      </tr>
                                      <tr>
                                        <td>Parça Numarası</td>
                                        <td>${formData.partNumber || "-"}</td>
                                      </tr>
                                      <tr>
                                        <td>Kategori</td>
                                        <td>${categories.find(c => c.id === formData.category)?.name || "-"}</td>
                                      </tr>
                                      <tr>
                                        <td>Boyutlar</td>
                                        <td>${formData.length || "-"} x ${formData.width || "-"} x ${formData.height || "-"} mm</td>
                                      </tr>
                                      <tr>
                                        <td>Ağırlık</td>
                                        <td>${formData.weight || "-"} gr</td>
                                      </tr>
                                      <tr>
                                        <td>Renk</td>
                                        <td>${formData.color || "-"}</td>
                                      </tr>
                                    </table>
                                    
                                    ${formData.description ? `
                                      <h3>Açıklama</h3>
                                      <div>${formData.description}</div>
                                    ` : ''}
                                  </div>
                                  
                                  <div class="media">
                                    ${imagePreview ? `
                                      <div>
                                        <img src="${imagePreview}" alt="${formData.name}" style="max-width: 100%; max-height: 200px;">
                                      </div>
                                    ` : ''}
                                    
                                    <div class="qr-container">
                                      ${qrCodeSvg}
                                      <div class="part-number">${formData.partNumber || ""}</div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </body>
                          </html>
                        `);
                        
                        printWindow.document.close();
                        printWindow.focus();
                        
                        // Kısa bir gecikme ile yazdır (içerik yüklensin)
                        setTimeout(() => {
                          printWindow.print();
                        }, 500);
                      }}
                    >
                      Yazdır
                    </Button>
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
      
      {/* Parça Listesi */}
      {isLoading ? (
        <div className="text-center py-4">Yükleniyor...</div>
      ) : isError ? (
        <div className="text-center py-4 text-red-500">Parçalar yüklenirken bir hata oluştu</div>
      ) : (
        <div className="border rounded-md">
          <Table>
            <TableCaption>Toplam {parts?.length || 0} parça</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>Parça No</TableHead>
                <TableHead>Adı</TableHead>
                <TableHead>Kategori</TableHead>
                <TableHead>Boyutlar</TableHead>
                <TableHead>QR Kod</TableHead>
                <TableHead className="text-right">İşlemler</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {parts?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center">
                    Henüz parça eklenmemiş
                  </TableCell>
                </TableRow>
              ) : (
                parts?.map((part: any) => (
                  <TableRow key={part.id}>
                    <TableCell className="font-medium">{part.partNumber}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {part.image && (
                          <div className="w-8 h-8 rounded-md overflow-hidden flex-shrink-0">
                            <img 
                              src={part.image} 
                              alt={part.name} 
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        {part.name}
                      </div>
                    </TableCell>
                    <TableCell>
                      {categories.find(c => c.id === part.category)?.name || part.category || "-"}
                    </TableCell>
                    <TableCell>
                      {part.length || part.width || part.height ? 
                        `${part.length || '-'} x ${part.width || '-'} x ${part.height || '-'} mm` : 
                        "-"}
                    </TableCell>
                    <TableCell>
                      {part.qrCode ? (
                        <div className="w-8 h-8">
                          <img 
                            src={part.qrCode} 
                            alt="QR Code" 
                            className="w-full h-full object-contain"
                          />
                        </div>
                      ) : "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(part)}
                        >
                          Düzenle
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(part.id)}
                          disabled={deletePartMutation.isPending}
                        >
                          Sil
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}