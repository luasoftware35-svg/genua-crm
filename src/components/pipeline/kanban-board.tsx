"use client";

import Link from "next/link";
import { useDraggable, useDroppable } from "@dnd-kit/core";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getPackageLabel, getStageLabel } from "@/lib/constants";
import type { Company, Deal, DealStage } from "@/types";

function DealCard({ deal, company }: { deal: Deal; company: Company }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: deal.id,
  });

  const style = transform
    ? { transform: `translate(${transform.x}px, ${transform.y}px)`, opacity: isDragging ? 0.4 : 1 }
    : undefined;

  const meta = [company.city, company.source].filter(Boolean).join(" · ");

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
      <Card className="cursor-grab transition-colors hover:bg-accent active:cursor-grabbing">
        <Link href={`/companies/${company.id}`} onClick={(e) => isDragging && e.preventDefault()}>
          <CardHeader className="space-y-2 p-4 pb-2">
            <div className="flex flex-wrap items-start gap-2">
              <CardTitle className="flex-1 text-sm leading-tight">{company.name}</CardTitle>
              {company.sector === "OSB Yönetimi" && (
                <Badge variant="outline" className="shrink-0 text-[10px]">
                  OSB Teklif
                </Badge>
              )}
            </div>
            <CardDescription className="text-xs">
              {company.sector && company.sector !== "OSB Yönetimi"
                ? company.sector
                : meta || "—"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-1 p-4 pt-0">
            {meta && company.sector && company.sector !== "OSB Yönetimi" && (
              <p className="text-xs text-muted-foreground">{meta}</p>
            )}
            {deal.estimated_value && (
              <p className="text-sm font-medium">
                ₺{deal.estimated_value.toLocaleString("tr-TR")}
              </p>
            )}
            {deal.proposed_package && (
              <p className="text-xs text-muted-foreground">
                {getPackageLabel(deal.proposed_package)}
              </p>
            )}
            {deal.next_follow_up && (
              <p className="text-xs text-muted-foreground">Takip: {deal.next_follow_up}</p>
            )}
          </CardContent>
        </Link>
      </Card>
    </div>
  );
}

function KanbanColumn({
  stage,
  label,
  deals,
  companies,
}: {
  stage: DealStage;
  label: string;
  deals: Deal[];
  companies: Company[];
}) {
  const { setNodeRef, isOver } = useDroppable({ id: stage });

  const sortedDeals = [...deals].sort(
    (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
  );

  return (
    <div className="flex w-[280px] flex-shrink-0 flex-col">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-semibold">{label}</h3>
        <Badge variant="secondary">{deals.length}</Badge>
      </div>
      <div
        ref={setNodeRef}
        className={`min-h-[160px] flex-1 space-y-2 overflow-y-auto rounded-lg p-2 transition-colors ${
          isOver ? "bg-accent/50 ring-2 ring-primary/20" : "bg-muted/30"
        }`}
        style={{ maxHeight: "calc(100vh - 320px)" }}
      >
        {sortedDeals.map((deal) => {
          const company = companies.find((c) => c.id === deal.company_id);
          if (!company) return null;
          return <DealCard key={deal.id} deal={deal} company={company} />;
        })}
        {deals.length === 0 && (
          <div className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
            Boş
          </div>
        )}
      </div>
    </div>
  );
}

type KanbanBoardProps = {
  deals: Deal[];
  companies: Company[];
};

export function KanbanBoard({ deals, companies }: KanbanBoardProps) {
  const activeStages = [
    "yeni",
    "mail_atildi",
    "yanit_var",
    "gorusme",
    "teklif",
  ] as DealStage[];
  const closedStages = ["kazanildi", "kaybedildi"] as DealStage[];

  return (
    <div className="space-y-6">
      <div className="flex gap-4 overflow-x-auto pb-4">
        {activeStages.map((stage) => (
          <KanbanColumn
            key={stage}
            stage={stage}
            label={getStageLabel(stage)}
            deals={deals.filter((d) => d.stage === stage)}
            companies={companies}
          />
        ))}
      </div>
      <div>
        <h3 className="mb-3 font-semibold text-muted-foreground">Kapanan</h3>
        <div className="flex gap-4 overflow-x-auto pb-2">
          {closedStages.map((stage) => (
            <KanbanColumn
              key={stage}
              stage={stage}
              label={getStageLabel(stage)}
              deals={deals.filter((d) => d.stage === stage)}
              companies={companies}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
