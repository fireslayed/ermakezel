import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, FileDown } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as Papa from "papaparse";

interface ExportButtonsProps {
  data: any[];
  fileName?: string;
  pdfTitle?: string;
}

export function ExportButtons({
  data,
  fileName = "tasks",
  pdfTitle = "Görevler Listesi",
}: ExportButtonsProps) {
  const [exportingPDF, setExportingPDF] = useState(false);
  const [exportingCSV, setExportingCSV] = useState(false);

  // Tarih formatını düzenle
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "-";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("tr-TR");
    } catch (e) {
      return dateString;
    }
  };

  // PDF olarak dışa aktar
  const exportToPDF = () => {
    setExportingPDF(true);
    try {
      const doc = new jsPDF();
      
      // Başlık
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.text(pdfTitle, 14, 15);
      
      // Alt bilgi - tarih
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text(
        `Oluşturulma Tarihi: ${new Date().toLocaleDateString("tr-TR")}`, 
        14, 
        22
      );
      
      // Tablo başlıkları ve veriler
      const tableHeaders = [
        "Başlık", 
        "Proje", 
        "Durum", 
        "Öncelik", 
        "Son Tarih"
      ];
      
      // Verileri düzenle
      const tableData = data.map(item => [
        item.title || "-",
        item.project?.name || "-",
        getStatusText(item.status),
        getPriorityText(item.priority),
        formatDate(item.dueDate),
      ]);
      
      // Tablo oluştur
      autoTable(doc, {
        head: [tableHeaders],
        body: tableData,
        startY: 30,
        theme: "grid",
        styles: {
          fontSize: 10,
          cellPadding: 3,
          lineColor: [220, 220, 220],
          lineWidth: 0.1,
        },
        headStyles: {
          fillColor: [66, 66, 66],
          textColor: [250, 250, 250],
          fontStyle: "bold",
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245],
        },
      });
      
      // PDF'i indir
      doc.save(`${fileName}.pdf`);
    } catch (error) {
      console.error("PDF oluşturma hatası:", error);
    } finally {
      setExportingPDF(false);
    }
  };

  // CSV olarak dışa aktar
  const exportToCSV = () => {
    setExportingCSV(true);
    try {
      // CSV için veri hazırla
      const csvData = data.map(item => ({
        "Başlık": item.title || "",
        "Açıklama": item.description || "",
        "Proje": item.project?.name || "",
        "Durum": getStatusText(item.status),
        "Öncelik": getPriorityText(item.priority),
        "Son Tarih": formatDate(item.dueDate),
        "Tamamlandı": item.completed ? "Evet" : "Hayır"
      }));
      
      // CSV formatına dönüştür
      const csv = Papa.unparse(csvData);
      
      // Dosyayı indir
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      
      // Tarayıcı desteklerine göre indirme işlemi
      if (navigator.msSaveBlob) {
        // IE 10+
        navigator.msSaveBlob(blob, `${fileName}.csv`);
      } else {
        // Modern tarayıcılar
        const url = URL.createObjectURL(blob);
        link.href = url;
        link.download = `${fileName}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error("CSV oluşturma hatası:", error);
    } finally {
      setExportingCSV(false);
    }
  };

  // Durum metinleri
  const getStatusText = (status?: string) => {
    switch (status) {
      case "pending": return "Bekliyor";
      case "in-progress": return "Devam Ediyor";
      case "completed": return "Tamamlandı";
      case "canceled": return "İptal Edildi";
      default: return "Bekliyor";
    }
  };

  // Öncelik metinleri
  const getPriorityText = (priority?: string) => {
    switch (priority) {
      case "low": return "Düşük";
      case "medium": return "Orta";
      case "high": return "Yüksek";
      case "urgent": return "Acil";
      default: return "Orta";
    }
  };

  return (
    <div className="flex space-x-2">
      <Button
        variant="outline"
        size="sm"
        onClick={exportToPDF}
        disabled={exportingPDF || data.length === 0}
        className="gap-1"
      >
        {exportingPDF ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>PDF Hazırlanıyor</span>
          </>
        ) : (
          <>
            <FileDown className="h-4 w-4" />
            <span>PDF İndir</span>
          </>
        )}
      </Button>
      
      <Button
        variant="outline"
        size="sm"
        onClick={exportToCSV}
        disabled={exportingCSV || data.length === 0}
        className="gap-1"
      >
        {exportingCSV ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>CSV Hazırlanıyor</span>
          </>
        ) : (
          <>
            <FileDown className="h-4 w-4" />
            <span>CSV İndir</span>
          </>
        )}
      </Button>
    </div>
  );
}