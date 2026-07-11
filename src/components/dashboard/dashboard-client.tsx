"use client";

import { Building2, RefreshCw, TrendingUp, Users } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { CampaignOverview } from "@/components/dashboard/campaign-overview";
import { PipelineChart, SourceChart } from "@/components/dashboard/charts";
import { TodayFollowUps } from "@/components/dashboard/today-follow-ups";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCrm } from "@/context/crm-context";
import {
  getActiveCampaignPipelineBreakdown,
  getActiveCampaignStats,
  isActiveCampaign,
} from "@/lib/pipeline-filters";

export function DashboardClient() {
  const {
    companies,
    deals,
    isLoading,
    refreshData,
    getTodayFollowUps,
  } = useCrm();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    refreshData().catch(() => undefined);
  }, [refreshData]);

  const activeCompanies = useMemo(
    () => companies.filter(isActiveCampaign),
    [companies]
  );
  const activeCompanyIds = useMemo(
    () => new Set(activeCompanies.map((c) => c.id)),
    [activeCompanies]
  );
  const campaignStats = useMemo(
    () => getActiveCampaignStats(companies, deals),
    [companies, deals]
  );
  const pipelineBreakdown = useMemo(
    () => getActiveCampaignPipelineBreakdown(companies, deals),
    [companies, deals]
  );

  const mailSentTotal = campaignStats.reduce((sum, c) => sum + c.mailSent, 0);
  const activePipelineCount = Object.entries(pipelineBreakdown)
    .filter(([stage]) => !["kazanildi", "kaybedildi"].includes(stage))
    .reduce((sum, [, count]) => sum + count, 0);
  const todayFollowUps = getTodayFollowUps().filter((item) =>
    activeCompanyIds.has(item.company.id)
  ).length;

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshData();
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Genua Digital — aktif kampanya özeti</p>
        </div>
        <Button variant="outline" onClick={handleRefresh} disabled={refreshing || isLoading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          Verileri yenile
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Aktif Kampanya</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeCompanies.length}</div>
            <p className="text-xs text-muted-foreground">
              OSB teklif {campaignStats[0]?.total ?? 0} · Uşak {campaignStats[1]?.total ?? 0}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Mail Atıldı</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mailSentTotal}</div>
            <p className="text-xs text-muted-foreground">
              OSB {campaignStats[0]?.mailSent ?? 0} · Uşak {campaignStats[1]?.mailSent ?? 0}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Aktif Pipeline</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activePipelineCount}</div>
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
            <p className="text-xs text-muted-foreground">Aktif kampanyalarda</p>
          </CardContent>
        </Card>
      </div>

      <CampaignOverview />

      <div className="grid gap-6 lg:grid-cols-2">
        <SourceChart companies={activeCompanies} />
        <PipelineChart breakdown={pipelineBreakdown} />
      </div>

      <TodayFollowUps companyFilter={isActiveCampaign} />
    </div>
  );
}
