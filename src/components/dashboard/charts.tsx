"use client";

import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DEAL_STAGES } from "@/lib/constants";
import type { Company } from "@/types";

const CHART_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

type SourceChartProps = {
  companies: Company[];
};

export function SourceChart({ companies }: SourceChartProps) {
  const counts: Record<string, number> = {};
  for (const company of companies) {
    const key =
      company.sector === "OSB Yönetimi"
        ? "OSB Teklif"
        : company.source === "UOSB"
          ? "Uşak OSB"
          : company.source ?? "Diğer";
    counts[key] = (counts[key] ?? 0) + 1;
  }
  const data = Object.entries(counts).map(([name, value]) => ({ name, value }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Kampanya Dağılımı</CardTitle>
        <CardDescription>Aktif kampanyalardaki kayıt sayıları</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={240}>
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={90}
              paddingAngle={4}
            >
              {data.map((_, index) => (
                <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
        <div className="mt-2 flex flex-wrap justify-center gap-4">
          {data.map((item, index) => (
            <div key={item.name} className="flex items-center gap-2 text-sm">
              <div
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
              />
              <span className="text-muted-foreground">{item.name}</span>
              <span className="font-medium">{item.value}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

type PipelineChartProps = {
  breakdown: Record<string, number>;
};

export function PipelineChart({ breakdown }: PipelineChartProps) {
  const data = DEAL_STAGES.map((stage) => ({
    name: stage.label,
    count: breakdown[stage.value] ?? 0,
  })).filter((d) => d.count > 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pipeline Aşamaları</CardTitle>
        <CardDescription>Aktif kampanyalardaki aşama dağılımı</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={data} layout="vertical" margin={{ left: 20 }}>
            <XAxis type="number" allowDecimals={false} />
            <YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 12 }} />
            <Tooltip />
            <Bar dataKey="count" fill="var(--primary)" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
