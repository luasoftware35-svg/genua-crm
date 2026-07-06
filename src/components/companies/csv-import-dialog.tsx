"use client";

import { useRef, useState } from "react";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useCrm } from "@/context/crm-context";
import {
  autoDetectColumns,
  getCsvHeaders,
  mapRowsToCompanies,
  parseCsvFile,
  type CsvColumnMapping,
  type ParsedCompanyRow,
} from "@/lib/csv-import";

const FIELDS: { key: keyof CsvColumnMapping; label: string; required?: boolean }[] = [
  { key: "name", label: "Firma Adı", required: true },
  { key: "website", label: "Web Sitesi" },
  { key: "email", label: "E-posta" },
  { key: "phone", label: "Telefon" },
  { key: "source", label: "Kaynak (BOSB/DOSB)" },
  { key: "sector", label: "Sektör" },
];

export function CsvImportDialog() {
  const { importCompanies } = useCrm();
  const fileRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [mapping, setMapping] = useState<Partial<CsvColumnMapping>>({});
  const [preview, setPreview] = useState<ParsedCompanyRow[]>([]);
  const [step, setStep] = useState<"upload" | "map" | "preview">("upload");

  const reset = () => {
    setHeaders([]);
    setRows([]);
    setMapping({});
    setPreview([]);
    setStep("upload");
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleFile = async (file: File) => {
    const parsed = await parseCsvFile(file);
    const hdrs = getCsvHeaders(parsed);
    const detected = autoDetectColumns(hdrs);
    setRows(parsed);
    setHeaders(hdrs);
    setMapping(detected);
    setStep("map");
  };

  const handlePreview = () => {
    if (!mapping.name) return;
    setPreview(mapRowsToCompanies(rows, mapping));
    setStep("preview");
  };

  const handleImport = async () => {
    const { created, updated } = await importCompanies(preview);
    setOpen(false);
    reset();
    alert(`${created + updated} firma içe aktarıldı (${created} yeni, ${updated} güncelleme).`);
  };

  return (
    <>
      <input
        ref={fileRef}
        type="file"
        accept=".csv,.txt"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            setOpen(true);
            handleFile(file);
          }
        }}
      />
      <Button variant="outline" onClick={() => fileRef.current?.click()}>
        <Upload className="mr-2 h-4 w-4" />
        CSV İçe Aktar
      </Button>

      <Dialog
        open={open}
        onOpenChange={(v) => {
          setOpen(v);
          if (!v) reset();
        }}
      >
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>CSV İçe Aktarma</DialogTitle>
            <DialogDescription>
              BOSB/DOSB listelerinizi yükleyin. Sütun eşleştirmesini kontrol edin.
            </DialogDescription>
          </DialogHeader>

          {step === "map" && (
            <div className="grid gap-4 py-2">
              <p className="text-sm text-muted-foreground">{rows.length} satır bulundu</p>
              {FIELDS.map(({ key, label, required }) => (
                <div key={key} className="grid grid-cols-2 items-center gap-4">
                  <Label>
                    {label}
                    {required && " *"}
                  </Label>
                  <Select
                    value={mapping[key] ?? "__skip__"}
                    onValueChange={(v) =>
                      setMapping({ ...mapping, [key]: v === "__skip__" ? undefined : v })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sütun seç" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__skip__">— Atla —</SelectItem>
                      {headers.map((h) => (
                        <SelectItem key={h} value={h}>
                          {h}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
          )}

          {step === "preview" && (
            <div className="py-2">
              <p className="mb-3 text-sm text-muted-foreground">
                {preview.length} firma içe aktarılacak
              </p>
              <div className="rounded-md border max-h-64 overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Firma</TableHead>
                      <TableHead>Web</TableHead>
                      <TableHead>Kaynak</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {preview.slice(0, 10).map((row, i) => (
                      <TableRow key={i}>
                        <TableCell>{row.name}</TableCell>
                        <TableCell className="text-xs">{row.website ?? "—"}</TableCell>
                        <TableCell>{row.source ?? "—"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {preview.length > 10 && (
                <p className="mt-2 text-xs text-muted-foreground">
                  +{preview.length - 10} firma daha...
                </p>
              )}
            </div>
          )}

          <DialogFooter>
            {step === "map" && (
              <>
                <Button variant="outline" onClick={() => setOpen(false)}>
                  İptal
                </Button>
                <Button onClick={handlePreview} disabled={!mapping.name}>
                  Önizle
                </Button>
              </>
            )}
            {step === "preview" && (
              <>
                <Button variant="outline" onClick={() => setStep("map")}>
                  Geri
                </Button>
                <Button onClick={handleImport} disabled={preview.length === 0}>
                  {preview.length} Firmayı İçe Aktar
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
