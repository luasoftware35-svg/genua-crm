"use client";

import { useState } from "react";
import { format, parseISO } from "date-fns";
import { tr } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
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
import { DEAL_STAGES, getPackageLabel, getStageLabel, PROPOSED_PACKAGES } from "@/lib/constants";
import { useCrm } from "@/context/crm-context";
import type { Deal, DealStage, ProposedPackage } from "@/types";

export function DealPanel({ deal }: { deal: Deal }) {
  const { updateDeal } = useCrm();
  const [stage, setStage] = useState(deal.stage);
  const [pkg, setPkg] = useState(deal.proposed_package ?? "__none__");
  const [value, setValue] = useState(deal.estimated_value?.toString() ?? "");
  const [followUp, setFollowUp] = useState(deal.next_follow_up ?? "");
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    updateDeal(deal.id, {
      stage: stage as DealStage,
      proposed_package: pkg === "__none__" ? null : (pkg as ProposedPackage),
      estimated_value: value ? Number(value) : null,
      next_follow_up: followUp || null,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Pipeline</CardTitle>
        <Button size="sm" onClick={handleSave}>
          {saved ? "Kaydedildi ✓" : "Kaydet"}
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Aşama</Label>
          <Select value={stage} onValueChange={(v) => setStage(v as DealStage)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DEAL_STAGES.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Önerilen Paket</Label>
          <Select value={pkg} onValueChange={setPkg}>
            <SelectTrigger>
              <SelectValue placeholder="Paket seç" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">—</SelectItem>
              {PROPOSED_PACKAGES.map((p) => (
                <SelectItem key={p.value} value={p.value}>
                  {p.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {deal.proposed_package && (
            <Badge variant="outline" className="mt-1">
              Mevcut: {getPackageLabel(deal.proposed_package)}
            </Badge>
          )}
        </div>
        <div className="space-y-2">
          <Label>Tahmini Değer (₺)</Label>
          <Input
            type="number"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="45000"
          />
        </div>
        <div className="space-y-2">
          <Label>Sonraki Takip</Label>
          <Input type="date" value={followUp} onChange={(e) => setFollowUp(e.target.value)} />
          {deal.next_follow_up && (
            <p className="text-xs text-muted-foreground">
              {format(parseISO(deal.next_follow_up), "d MMMM yyyy", { locale: tr })}
            </p>
          )}
        </div>
        <div className="pt-2 border-t">
          <p className="text-xs text-muted-foreground">
            Aşama: <span className="font-medium">{getStageLabel(deal.stage)}</span>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
