"use client";

import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { RefreshCw, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { KanbanBoard } from "@/components/pipeline/kanban-board";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCrm } from "@/context/crm-context";
import { DEAL_STAGES } from "@/lib/constants";
import {
  filterCompaniesByCampaign,
  filterDealsForCompanies,
  getPipelineStageCounts,
  PIPELINE_CAMPAIGNS,
  type PipelineCampaign,
} from "@/lib/pipeline-filters";
import type { DealStage } from "@/types";

const STAGES: DealStage[] = [
  "yeni",
  "mail_atildi",
  "yanit_var",
  "gorusme",
  "teklif",
  "kazanildi",
  "kaybedildi",
];

export function PipelineClient() {
  const { deals, companies, updateDealStage, refreshData, isLoading } = useCrm();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [campaign, setCampaign] = useState<PipelineCampaign>("active");
  const [search, setSearch] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  useEffect(() => {
    refreshData().catch(() => undefined);
  }, [refreshData]);

  const campaignMeta = PIPELINE_CAMPAIGNS.find((c) => c.value === campaign)!;

  const filteredCompanies = useMemo(() => {
    const byCampaign = filterCompaniesByCampaign(companies, campaign);
    const q = search.trim().toLowerCase();
    if (!q) return byCampaign;
    return byCampaign.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.city ?? "").toLowerCase().includes(q) ||
        (c.source ?? "").toLowerCase().includes(q) ||
        (c.sector ?? "").toLowerCase().includes(q)
    );
  }, [companies, campaign, search]);

  const companyIds = useMemo(
    () => new Set(filteredCompanies.map((c) => c.id)),
    [filteredCompanies]
  );

  const filteredDeals = useMemo(
    () => filterDealsForCompanies(deals, companyIds),
    [deals, companyIds]
  );

  const stageCounts = useMemo(() => getPipelineStageCounts(filteredDeals), [filteredDeals]);

  const activeDeal = activeId ? filteredDeals.find((d) => d.id === activeId) : null;
  const activeCompany = activeDeal
    ? filteredCompanies.find((c) => c.id === activeDeal.company_id)
    : null;

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshData();
    } finally {
      setRefreshing(false);
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;

    const dealId = active.id as string;
    const newStage = over.id as DealStage;

    if (STAGES.includes(newStage)) {
      updateDealStage(dealId, newStage);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Select value={campaign} onValueChange={(v) => setCampaign(v as PipelineCampaign)}>
              <SelectTrigger className="w-[220px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PIPELINE_CAMPAIGNS.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Badge variant="secondary">{filteredDeals.length} kayıt</Badge>
            {isLoading && <Badge variant="outline">Yükleniyor…</Badge>}
          </div>
          <p className="text-sm text-muted-foreground">{campaignMeta.description}</p>
        </div>

        <div className="flex w-full flex-col gap-2 sm:flex-row lg:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Firma, şehir veya kaynak ara…"
              className="pl-9"
            />
          </div>
          <Button variant="outline" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            Yenile
          </Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
        {DEAL_STAGES.map((stage) => (
          <Card key={stage.value}>
            <CardHeader className="p-3 pb-1">
              <CardTitle className="text-xs font-medium text-muted-foreground">
                {stage.label}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0">
              <div className="text-2xl font-bold">{stageCounts[stage.value] ?? 0}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <KanbanBoard deals={filteredDeals} companies={filteredCompanies} />
        <DragOverlay>
          {activeDeal && activeCompany ? (
            <Card className="w-[240px] rotate-2 shadow-lg">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-sm">{activeCompany.name}</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0 text-sm text-muted-foreground">
                Sürükleniyor…
              </CardContent>
            </Card>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
