import { useState } from "react";
import { format } from "date-fns";
import { CKEditor } from "@ckeditor/ckeditor5-react";
import ClassicEditor from "@ckeditor/ckeditor5-build-classic";
import { z } from "zod";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Rapor türleri
const reportTypes = [
  { id: "daily", name: "Günlük Rapor" },
  { id: "weekly", name: "Haftalık Rapor" },
  { id: "monthly", name: "Aylık Rapor" },
  { id: "issue", name: "Sorun Bildirimi" },
  { id: "maintenance", name: "Bakım Raporu" },
];

interface ReportFormProps {
  defaultValues?: any;
  onSubmit: (data: any) => void;
  projects: any[];
  isSubmitting: boolean;
}

// Rapor doğrulama şeması
const reportSchema = z.object({
  title: z.string().min(3, "Başlık en az 3 karakter olmalıdır"),
  location: z.string().min(2, "Konum en az 2 karakter olmalıdır"),
  description: z.string().min(10, "Açıklama en az 10 karakter olmalıdır"),
  projectId: z.string().optional(),
  reportType: z.string(),
  reportDate: z.string(),
});

export function ReportForm({
  defaultValues,
  onSubmit,
  projects,
  isSubmitting,
}: ReportFormProps) {
  const [previewMode, setPreviewMode] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    title: defaultValues?.title || "",
    location: defaultValues?.location || "",
    description: defaultValues?.description || "",
    projectId: defaultValues?.projectId?.toString() || "",
    reportType: defaultValues?.reportType || "daily",
    files: defaultValues?.files || [],
    reportDate: defaultValues?.reportDate || format(new Date(), "yyyy-MM-dd"),
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditorChange = (data: string) => {
    setFormData((prev) => ({ ...prev, description: data }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Form hatalarını temizle
      setErrors({});
      
      // Form verilerini doğrula
      reportSchema.parse(formData);
      
      // Verileri düzenle (projectId için number dönüşümü yapılıyor)
      const submissionData = {
        ...formData,
        projectId: formData.projectId ? parseInt(formData.projectId) : null,
      };
      
      onSubmit(submissionData);
    } catch (error) {
      if (error instanceof z.ZodError) {
        // Doğrulama hatalarını alan bazında kaydet
        const fieldErrors: Record<string, string> = {};
        
        error.errors.forEach((err) => {
          if (err.path.length > 0) {
            const fieldName = err.path[0].toString();
            fieldErrors[fieldName] = err.message;
          }
        });
        
        // Hataları state'e kaydet
        setErrors(fieldErrors);
      }
    }
  };

  return (
    <div className="max-w-full w-full overflow-hidden">
      <form onSubmit={handleSubmit} className="space-y-6 w-full">
        <div className="grid grid-cols-1 gap-5 w-full">
          {/* Rapor başlığı */}
          <div className="space-y-2 w-full">
            <Label htmlFor="title" className="block text-sm font-medium">Rapor Başlığı</Label>
            <Input
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Rapor başlığını girin"
              required
              className={cn("w-full box-border", errors.title ? "border-red-500" : "")}
            />
            {errors.title && (
              <p className="text-sm text-red-500 mt-1">{errors.title}</p>
            )}
          </div>

          {/* Rapor tarihi */}
          <div className="space-y-2 w-full">
            <Label htmlFor="reportDate" className="block text-sm font-medium">Rapor Tarihi</Label>
            <Input
              id="reportDate"
              name="reportDate"
              type="date"
              value={formData.reportDate}
              onChange={handleChange}
              required
              className={cn("w-full box-border", errors.reportDate ? "border-red-500" : "")}
            />
            {errors.reportDate && (
              <p className="text-sm text-red-500 mt-1">{errors.reportDate}</p>
            )}
          </div>

          {/* Rapor türü ve proje - grid içinde yan yana */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 w-full">
            <div className="space-y-2 w-full">
              <Label htmlFor="reportType" className="block text-sm font-medium">Rapor Türü</Label>
              <Select
                value={formData.reportType}
                onValueChange={(value) => handleSelectChange("reportType", value)}
              >
                <SelectTrigger className={cn("w-full box-border", errors.reportType ? "border-red-500" : "")}>
                  <SelectValue placeholder="Rapor türünü seçin" />
                </SelectTrigger>
                <SelectContent>
                  {reportTypes.map((type) => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.reportType && (
                <p className="text-sm text-red-500 mt-1">{errors.reportType}</p>
              )}
            </div>

            <div className="space-y-2 w-full">
              <Label htmlFor="projectId" className="block text-sm font-medium">İlgili Proje</Label>
              <Select
                value={formData.projectId}
                onValueChange={(value) => handleSelectChange("projectId", value)}
              >
                <SelectTrigger className={cn("w-full box-border", errors.projectId ? "border-red-500" : "")}>
                  <SelectValue placeholder="Proje seçin (opsiyonel)" />
                </SelectTrigger>
                <SelectContent>
                  {projects?.map((project) => (
                    <SelectItem key={project.id} value={project.id.toString()}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.projectId && (
                <p className="text-sm text-red-500 mt-1">{errors.projectId}</p>
              )}
            </div>
          </div>

          {/* Konum */}
          <div className="space-y-2 w-full">
            <Label htmlFor="location" className="block text-sm font-medium">Konum</Label>
            <Input
              id="location"
              name="location"
              value={formData.location}
              onChange={handleChange}
              placeholder="Rapor konumunu girin (opsiyonel)"
              className="w-full box-border"
            />
          </div>

          {/* Açıklama - CKEditor */}
          <div className="space-y-2 w-full">
            <Label htmlFor="description" className="block text-sm font-medium">Açıklama</Label>
            <div className="border rounded-md overflow-hidden w-full box-border">
              <div className="w-full max-w-full" style={{ 
                boxSizing: 'border-box',
                overflowX: 'hidden'
              }}>
{/* CKEditor stilleri artık harici CSS dosyasında */}
                <CKEditor
                  editor={ClassicEditor}
                  data={formData.description || ""}
                  onChange={(event, editor) => {
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
                        "imageUpload",
                        "|",
                        "undo",
                        "redo",
                      ],
                      shouldNotGroupWhenFull: true
                    },
                    language: "tr",
                    placeholder:
                      "Rapor detaylarını girin (zengin metin düzenleme özelliklerini kullanabilirsiniz)",
                    image: {
                      toolbar: [
                        "imageTextAlternative",
                        "imageStyle:inline",
                        "imageStyle:block",
                        "imageStyle:side",
                      ],
                    },
                  }}
                />
              </div>
            </div>
          </div>

          {/* Dosya yükleme (ileri versiyonlarda eklenecek) */}
          <div className="space-y-2 w-full">
            <Label htmlFor="files" className="block text-sm font-medium">Dosyalar</Label>
            <div className="p-4 border border-dashed rounded-md text-center text-muted-foreground w-full box-border">
              <p>Dosya yükleme özelliği yakında eklenecek</p>
            </div>
          </div>

          {/* Önizleme ve Yazdırma Butonları */}
          <div className="flex flex-wrap gap-2 w-full mt-2">
            <Button
              type="button"
              variant="outline"
              className="flex items-center gap-2"
              onClick={() => setPreviewMode(!previewMode)}
            >
              <span role="img" aria-label="Önizleme">
                🔍
              </span>
              {previewMode ? "Düzenlemeye Dön" : "Raporu Önizle"}
            </Button>

            {previewMode && (
              <Button
                type="button"
                variant="outline"
                className="flex items-center gap-2"
                onClick={() => {
                  const printWindow = window.open("", "_blank");
                  if (printWindow) {
                    printWindow.document.write(`
                      <html>
                        <head>
                          <title>${formData.title || "Rapor"}</title>
                          <style>
                            body { font-family: Arial, sans-serif; margin: 20px; }
                            h1 { font-size: 24px; margin-bottom: 10px; }
                            .report-date { color: #666; margin-bottom: 20px; }
                            .report-content { line-height: 1.5; }
                          </style>
                        </head>
                        <body>
                          <h1>${formData.title || "Rapor"}</h1>
                          <div class="report-date">Tarih: ${
                            formData.reportDate
                          }</div>
                          <div class="report-content">${
                            formData.description || ""
                          }</div>
                        </body>
                      </html>
                    `);
                    printWindow.document.close();
                    printWindow.print();
                  }
                }}
              >
                <span role="img" aria-label="Yazdır">
                  🖨️
                </span>{" "}
                Yazdır
              </Button>
            )}
          </div>

          {/* Önizleme Paneli */}
          {previewMode && (
            <div className="p-4 border rounded-md bg-white w-full box-border">
              <h3 className="text-lg font-medium mb-2">
                {formData.title || "Rapor"}
              </h3>
              <div className="text-sm text-gray-500 mb-4">
                Tarih: {formData.reportDate}
              </div>
              <div
                className="prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: formData.description || "" }}
              />
            </div>
          )}

          {/* Kaydet/Güncelle Butonu */}
          <div className="w-full">
            <Button
              type="submit"
              className="w-full py-5"
              disabled={isSubmitting}
            >
              {isSubmitting
                ? "Kaydediliyor..."
                : defaultValues
                ? "Raporu Güncelle"
                : "Raporu Kaydet"}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}