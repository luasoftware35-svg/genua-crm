"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { useCrm } from "@/context/crm-context";

export function DataManagementDialog() {
  const { companies, clearAllData } = useCrm();
  const [open, setOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [loading, setLoading] = useState(false);

  const handleClear = async () => {
    if (confirmText !== "SIL") return;
    setLoading(true);
    try {
      await clearAllData();
      setOpen(false);
      setConfirmText("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="text-destructive">
          <Trash2 className="mr-2 h-4 w-4" />
          Tüm Veriyi Temizle
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Tüm CRM verisini sil</DialogTitle>
          <DialogDescription>
            {companies.length} firma ve ilişkili tüm deal, kişi ve aktiviteler kalıcı olarak
            silinecek. Bu işlem geri alınamaz.
          </DialogDescription>
        </DialogHeader>
        <p className="text-sm">
          Onaylamak için kutuya <strong>SIL</strong> yazın.
        </p>
        <Input
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
          placeholder="SIL"
        />
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Vazgeç
          </Button>
          <Button
            variant="destructive"
            disabled={confirmText !== "SIL" || loading}
            onClick={handleClear}
          >
            {loading ? "Siliniyor..." : "Kalıcı Olarak Sil"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
