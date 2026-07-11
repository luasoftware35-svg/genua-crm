"use client";

import Link from "next/link";
import { format, parseISO } from "date-fns";
import { tr } from "date-fns/locale";
import { ArrowRight, Calendar } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getStageLabel } from "@/lib/constants";
import { useCrm } from "@/context/crm-context";
import { cn } from "@/lib/utils";
import type { Company } from "@/types";

type TodayFollowUpsProps = {
  companyFilter?: (company: Company) => boolean;
};

export function TodayFollowUps({ companyFilter }: TodayFollowUpsProps) {
  const { getTodayFollowUps } = useCrm();
  const followUps = getTodayFollowUps().filter(({ company }) =>
    companyFilter ? companyFilter(company) : true
  );
  const todayStr = format(new Date(), "yyyy-MM-dd");

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Bugün Takip Edilecekler
          </CardTitle>
          <CardDescription>
            {followUps.length} firma için takip tarihi bugün veya geçmiş
          </CardDescription>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href="/follow-ups">
            Tümünü Gör
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        {followUps.length === 0 ? (
          <p className="text-sm text-muted-foreground">Bugün takip edilecek firma yok.</p>
        ) : (
          <ul className="space-y-3">
            {followUps.map(({ deal, company }) => {
              const overdue = deal.next_follow_up && deal.next_follow_up < todayStr;
              return (
                <li key={deal.id}>
                  <Link
                    href={`/companies/${company.id}`}
                    className={cn(
                      "flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-accent",
                      overdue && "border-red-200 bg-red-50/50"
                    )}
                  >
                    <div>
                      <p className="font-medium">{company.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {deal.next_follow_up &&
                          format(parseISO(deal.next_follow_up), "d MMMM yyyy", { locale: tr })}
                        {overdue && <span className="ml-2 text-red-600">Gecikmiş</span>}
                      </p>
                    </div>
                    <Badge variant="secondary">{getStageLabel(deal.stage)}</Badge>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
