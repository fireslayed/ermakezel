import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useState } from "react";
import { ReportForm } from "./report-form";

interface ReportDialogProps {
  title?: string;
  description?: string;
  defaultValues?: any;
  onSubmit: (data: any) => void;
  projects: any[];
  isSubmitting: boolean;
  trigger: React.ReactNode;
}

export function ReportDialog({
  title = "Yeni Rapor Oluştur",
  description = "Yeni bir rapor oluşturmak için aşağıdaki formu doldurun",
  defaultValues,
  onSubmit,
  projects,
  isSubmitting,
  trigger,
}: ReportDialogProps) {
  const [open, setOpen] = useState(false);

  const handleSubmit = (data: any) => {
    onSubmit(data);
    // Form başarıyla gönderildiğinde dialogu kapatmayacağız
    // Kullanıcı başarılı durumu görebilsin ve kapatsın
    if (!isSubmitting) {
      setOpen(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[800px] lg:max-w-[900px] max-h-[90vh] overflow-y-auto report-dialog-content">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="py-4 max-w-full overflow-hidden">
          <ReportForm
            defaultValues={defaultValues}
            onSubmit={handleSubmit}
            projects={projects}
            isSubmitting={isSubmitting}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}