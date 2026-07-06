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
import { useState } from "react";
import { KanbanBoard } from "@/components/pipeline/kanban-board";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCrm } from "@/context/crm-context";
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
  const { deals, companies, updateDealStage } = useCrm();
  const [activeId, setActiveId] = useState<string | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const activeDeal = activeId ? deals.find((d) => d.id === activeId) : null;
  const activeCompany = activeDeal
    ? companies.find((c) => c.id === activeDeal.company_id)
    : null;

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
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <KanbanBoard />
      <DragOverlay>
        {activeDeal && activeCompany ? (
          <Card className="w-[240px] shadow-lg rotate-2">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-sm">{activeCompany.name}</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 text-sm text-muted-foreground">
              Sürükleniyor...
            </CardContent>
          </Card>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
