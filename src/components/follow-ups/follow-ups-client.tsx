"use client";

import Link from "next/link";
import { format, parseISO } from "date-fns";
import { tr } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DEAL_STAGES, getStageLabel } from "@/lib/constants";
import { useCrm } from "@/context/crm-context";
import { cn } from "@/lib/utils";
import type { DealStage } from "@/types";

function FollowUpItem({
  deal,
  company,
  isOverdue,
}: {
  deal: { id: string; stage: DealStage; next_follow_up: string | null; estimated_value: number | null };
  company: { id: string; name: string };
  isOverdue?: boolean;
}) {
  const { rescheduleFollowUp, updateDealStage } = useCrm();
  const todayStr = format(new Date(), "yyyy-MM-dd");
  const overdue = deal.next_follow_up && deal.next_follow_up < todayStr;

  return (
    <li>
      <div
        className={cn(
          "rounded-lg border p-4",
          (isOverdue || overdue) && "border-red-200 bg-red-50/50"
        )}
      >
        <div className="flex items-start justify-between gap-4">
          <Link href={`/companies/${company.id}`} className="flex-1 hover:underline">
            <p className="font-medium">{company.name}</p>
            <p className="text-sm text-muted-foreground">
              {deal.next_follow_up &&
                format(parseISO(deal.next_follow_up), "d MMMM yyyy, EEEE", { locale: tr })}
              {overdue && <span className="ml-2 text-red-600 font-medium">Gecikmiş</span>}
            </p>
          </Link>
          <div className="flex items-center gap-2">
            {deal.estimated_value && (
              <span className="text-sm text-muted-foreground hidden sm:inline">
                ₺{deal.estimated_value.toLocaleString("tr-TR")}
              </span>
            )}
            <Badge variant="secondary">{getStageLabel(deal.stage)}</Badge>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={() => rescheduleFollowUp(deal.id, 1)}>
            +1 gün
          </Button>
          <Button size="sm" variant="outline" onClick={() => rescheduleFollowUp(deal.id, 7)}>
            +7 gün
          </Button>
          {DEAL_STAGES.filter((s) => s.value === "mail_atildi" || s.value === "gorusme").map(
            (s) => (
              <Button
                key={s.value}
                size="sm"
                variant="ghost"
                onClick={() => updateDealStage(deal.id, s.value)}
              >
                → {s.label}
              </Button>
            )
          )}
        </div>
      </div>
    </li>
  );
}

export function FollowUpsClient() {
  const { getTodayFollowUps, getWeekFollowUps } = useCrm();
  const todayItems = getTodayFollowUps();
  const weekItems = getWeekFollowUps();
  const todayStr = format(new Date(), "yyyy-MM-dd");

  return (
    <Tabs defaultValue="today">
      <TabsList>
        <TabsTrigger value="today">Bugün ({todayItems.length})</TabsTrigger>
        <TabsTrigger value="week">Bu Hafta ({weekItems.length})</TabsTrigger>
      </TabsList>
      <TabsContent value="today" className="mt-4">
        <Card>
          <CardHeader>
            <CardTitle>Bugün Takip Edilecekler</CardTitle>
            <CardDescription>Takip tarihi bugün veya geçmiş olan firmalar</CardDescription>
          </CardHeader>
          <CardContent>
            {todayItems.length === 0 ? (
              <p className="text-sm text-muted-foreground">Bugün takip edilecek firma yok.</p>
            ) : (
              <ul className="space-y-3">
                {todayItems.map(({ deal, company }) => (
                  <FollowUpItem
                    key={deal.id}
                    deal={deal}
                    company={company}
                    isOverdue={!!deal.next_follow_up && deal.next_follow_up < todayStr}
                  />
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="week" className="mt-4">
        <Card>
          <CardHeader>
            <CardTitle>Bu Hafta</CardTitle>
            <CardDescription>Önümüzdeki 7 gün içinde takip edilecek firmalar</CardDescription>
          </CardHeader>
          <CardContent>
            {weekItems.length === 0 ? (
              <p className="text-sm text-muted-foreground">Bu hafta takip edilecek firma yok.</p>
            ) : (
              <ul className="space-y-3">
                {weekItems.map(({ deal, company }) => (
                  <FollowUpItem key={deal.id} deal={deal} company={company} />
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
