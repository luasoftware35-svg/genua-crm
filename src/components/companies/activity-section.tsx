"use client";

import { useState } from "react";
import { format, parseISO } from "date-fns";
import { tr } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ACTIVITY_TYPES, getActivityTypeLabel } from "@/lib/constants";
import { useCrm } from "@/context/crm-context";
import type { ActivityType } from "@/types";

export function ActivitySection({ companyId, dealId }: { companyId: string; dealId?: string }) {
  const { getActivitiesByCompanyId, createActivity } = useCrm();
  const activities = getActivitiesByCompanyId(companyId);
  const [type, setType] = useState<ActivityType>("not");
  const [note, setNote] = useState("");

  const handleAdd = () => {
    if (!note.trim()) return;
    createActivity({ company_id: companyId, deal_id: dealId, type, note: note.trim() });
    setNote("");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Aktivite Geçmişi</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
          <p className="text-sm font-medium">Yeni Aktivite</p>
          <div className="grid gap-3 sm:grid-cols-4">
            <div className="space-y-2">
              <Label>Tür</Label>
              <Select value={type} onValueChange={(v) => setType(v as ActivityType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ACTIVITY_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 sm:col-span-3">
              <Label>Not</Label>
              <Textarea
                rows={2}
                placeholder="Mail attım, yanıt geldi, görüşme ayarlandı..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>
          </div>
          <Button size="sm" onClick={handleAdd} disabled={!note.trim()}>
            Aktivite Ekle
          </Button>
        </div>

        {activities.length === 0 ? (
          <p className="text-sm text-muted-foreground">Henüz aktivite yok.</p>
        ) : (
          <ul className="space-y-3">
            {activities.map((activity) => (
              <li key={activity.id} className="flex gap-3">
                <Separator orientation="vertical" className="h-auto" />
                <div>
                  <p className="text-sm font-medium">{getActivityTypeLabel(activity.type)}</p>
                  <p className="text-sm text-muted-foreground">{activity.note}</p>
                  <p className="text-xs text-muted-foreground">
                    {format(parseISO(activity.created_at), "d MMM yyyy HH:mm", { locale: tr })}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
