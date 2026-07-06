"use client";

import { useState } from "react";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AUDIT_STATUSES, SOURCES } from "@/lib/constants";
import { useCrm } from "@/context/crm-context";
import type { AuditStatus, Company } from "@/types";

export function CompanyForm({ company }: { company: Company }) {
  const { updateCompany } = useCrm();
  const [form, setForm] = useState({
    name: company.name,
    sector: company.sector ?? "",
    website: company.website ?? "",
    email: company.email ?? "",
    phone: company.phone ?? "",
    source: company.source ?? "",
    audit_status: company.audit_status ?? "bilinmiyor",
  });
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    updateCompany(company.id, {
      name: form.name,
      sector: form.sector || null,
      website: form.website || null,
      email: form.email || null,
      phone: form.phone || null,
      source: form.source || null,
      audit_status: form.audit_status as AuditStatus,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <Card className="lg:col-span-2">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Firma Bilgileri</CardTitle>
        <Button size="sm" onClick={handleSave}>
          {saved ? "Kaydedildi ✓" : "Kaydet"}
        </Button>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label>Firma Adı</Label>
          <Input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label>Sektör</Label>
          <Input
            value={form.sector}
            onChange={(e) => setForm({ ...form, sector: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label>Kaynak</Label>
          <Select value={form.source} onValueChange={(v) => setForm({ ...form, source: v })}>
            <SelectTrigger>
              <SelectValue placeholder="Kaynak seç" />
            </SelectTrigger>
            <SelectContent>
              {SOURCES.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Web Sitesi</Label>
          <Input
            value={form.website}
            onChange={(e) => setForm({ ...form, website: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label>E-posta</Label>
          <Input
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label>Telefon</Label>
          <Input
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label>Denetim Durumu</Label>
          <Select
            value={form.audit_status}
            onValueChange={(v) => setForm({ ...form, audit_status: v as AuditStatus })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {AUDIT_STATUSES.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}
