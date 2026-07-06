"use client";

import { Building2, TrendingUp, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PipelineChart, SourceChart } from "@/components/dashboard/charts";
import { TodayFollowUps } from "@/components/dashboard/today-follow-ups";
import { useCrm } from "@/context/crm-context";

export function DashboardClient() {
  const {
    companies,
    getSourceBreakdown,
    getPipelineBreakdown,
    getTodayFollowUps,
  } = useCrm();

  const sourceBreakdown = getSourceBreakdown();
  const pipelineBreakdown = getPipelineBreakdown();
  const activeDeals = Object.entries(pipelineBreakdown)
    .filter(([stage]) => !["kazanildi", "kaybedildi"].includes(stage))
    .reduce((sum, [, count]) => sum + count, 0);
  const todayFollowUps = getTodayFollowUps().length;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Genua Digital — hedef müşteri özeti</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Toplam Firma</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{companies.length}</div>
            <p className="text-xs text-muted-foreground">
              {sourceBreakdown.map((s) => `${s.name}: ${s.value}`).join(" · ")}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Aktif Pipeline</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeDeals}</div>
            <p className="text-xs text-muted-foreground">Kazanıldı/kaybedildi hariç</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Bugün Takip</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todayFollowUps}</div>
            <p className="text-xs text-muted-foreground">Takip tarihi bugün veya geçmiş</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Kazanılan</CardTitle>
            <TrendingUp className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pipelineBreakdown.kazanildi ?? 0}</div>
            <p className="text-xs text-muted-foreground">
              Kaybedilen: {pipelineBreakdown.kaybedildi ?? 0}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <SourceChart />
        <PipelineChart />
      </div>

      <TodayFollowUps />
    </div>
  );
}
