import { useState } from "react";
import { format } from "date-fns";
import { CKEditor } from "@ckeditor/ckeditor5-react";
import ClassicEditor from "@ckeditor/ckeditor5-build-classic";

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

export function ReportForm({
  defaultValues,
  onSubmit,
  projects,
  isSubmitting,
}: ReportFormProps) {
  const [previewMode, setPreviewMode] = useState(false);
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

    // Verileri düzenle (projectId için number dönüşümü yapılıyor)
    const submissionData = {
      ...formData,
      projectId: formData.projectId ? parseInt(formData.projectId) : null,
    };

    onSubmit(submissionData);
  };

  return (
    <div className="max-w-full w-full overflow-hidden">
      <form onSubmit={handleSubmit} className="space-y-4 w-full">
        <div className="space-y-2 w-full">
          <Label htmlFor="title">Rapor Başlığı</Label>
          <Input
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="Rapor başlığını girin"
            required
            className="w-full"
          />
        </div>

        {/* Rapor tarihi - ayrı satırda tam genişlikte */}
        <div className="space-y-2 w-full mt-4 mb-4">
          <Label htmlFor="reportDate">Rapor Tarihi</Label>
          <Input
            id="reportDate"
            name="reportDate"
            type="date"
            value={formData.reportDate}
            onChange={handleChange}
            required
            className="w-full"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
          <div className="space-y-2 w-full">
            <Label htmlFor="reportType">Rapor Türü</Label>
            <Select
              value={formData.reportType}
              onValueChange={(value) => handleSelectChange("reportType", value)}
            >
              <SelectTrigger className="w-full">
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
          </div>

          <div className="space-y-2 w-full">
            <Label htmlFor="projectId">İlgili Proje</Label>
            <Select
              value={formData.projectId}
              onValueChange={(value) => handleSelectChange("projectId", value)}
            >
              <SelectTrigger className="w-full">
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
          </div>
        </div>

        <div className="space-y-2 w-full">
          <Label htmlFor="location">Konum</Label>
          <Input
            id="location"
            name="location"
            value={formData.location}
            onChange={handleChange}
            placeholder="Rapor konumunu girin (opsiyonel)"
            className="w-full"
          />
        </div>

        <div className="space-y-2 my-6 w-full">
          <Label htmlFor="description">Açıklama</Label>
          <div className="min-h-[300px] border rounded-md overflow-hidden p-0 w-full">
            <div className="w-full h-full">
              <CKEditor
                editor={ClassicEditor}
                data={formData.description || ""}
                onChange={(event, editor) => {
                  const data = editor.getData();
                  handleEditorChange(data);
                }}
                config={{
                  toolbar: [
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

        {/* Önizleme ve Yazdırma Butonları */}
        <div className="flex flex-wrap space-x-2 space-y-2 sm:space-y-0 mt-4">
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
          <div className="mt-4 p-4 border rounded-md bg-white">
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

        {/* Dosya yükleme (ileri versiyonlarda eklenecek) */}
        <div className="space-y-2 w-full my-6">
          <Label>Dosyalar</Label>
          <div className="p-4 border border-dashed rounded-md text-center text-muted-foreground w-full">
            <p>Dosya yükleme özelliği yakında eklenecek</p>
          </div>
        </div>

        <Button
          type="submit"
          className="w-full py-6 my-6"
          disabled={isSubmitting}
        >
          {isSubmitting
            ? "Kaydediliyor..."
            : defaultValues
            ? "Raporu Güncelle"
            : "Raporu Kaydet"}
        </Button>
      </form>
    </div>
  );
}