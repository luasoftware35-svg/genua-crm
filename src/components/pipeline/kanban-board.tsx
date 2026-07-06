"use client";

import Link from "next/link";
import { useDraggable, useDroppable } from "@dnd-kit/core";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getPackageLabel, getStageLabel } from "@/lib/constants";
import { useCrm } from "@/context/crm-context";
import type { Company, Deal, DealStage } from "@/types";

function DealCard({ deal, company }: { deal: Deal; company: Company }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: deal.id,
  });

  const style = transform
    ? { transform: `translate(${transform.x}px, ${transform.y}px)`, opacity: isDragging ? 0.4 : 1 }
    : undefined;

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
      <Card className="cursor-grab active:cursor-grabbing transition-colors hover:bg-accent">
        <Link href={`/companies/${company.id}`} onClick={(e) => isDragging && e.preventDefault()}>
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-sm leading-tight">{company.name}</CardTitle>
            <CardDescription className="text-xs">{company.sector ?? "—"}</CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-1">
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

  return (
    <div className="min-w-[260px] flex-shrink-0">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-semibold">{label}</h3>
        <Badge variant="secondary">{deals.length}</Badge>
      </div>
      <div
        ref={setNodeRef}
        className={`min-h-[120px] space-y-2 rounded-lg p-2 transition-colors ${
          isOver ? "bg-accent/50 ring-2 ring-primary/20" : "bg-muted/30"
        }`}
      >
        {deals.map((deal) => {
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

export function KanbanBoard() {
  const { deals, companies } = useCrm();
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
        <div className="flex gap-4 overflow-x-auto">
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
