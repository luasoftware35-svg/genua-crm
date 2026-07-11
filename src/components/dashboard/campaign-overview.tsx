"use client";

import Link from "next/link";
import { Mail, MailCheck, MailWarning } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useCrm } from "@/context/crm-context";
import { getActiveCampaignStats } from "@/lib/pipeline-filters";

export function CampaignOverview() {
  const { companies, deals } = useCrm();
  const campaigns = getActiveCampaignStats(companies, deals);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">Aktif Kampanyalar</h2>
          <p className="text-sm text-muted-foreground">Güncel mail ve pipeline durumu</p>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href="/pipeline">Pipeline&apos;a git</Link>
        </Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {campaigns.map((campaign) => (
          <Card key={campaign.id}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <CardTitle className="text-base">{campaign.label}</CardTitle>
                  <CardDescription>{campaign.total} kayıt</CardDescription>
                </div>
                <Badge variant={campaign.pending === 0 ? "default" : "secondary"}>
                  {campaign.mailSent}/{campaign.total} mail
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-lg border bg-muted/30 p-3">
                <div className="mb-1 flex items-center gap-2 text-xs text-muted-foreground">
                  <MailCheck className="h-3.5 w-3.5" />
                  Mail atıldı
                </div>
                <div className="text-2xl font-bold">{campaign.mailSent}</div>
              </div>
              <div className="rounded-lg border bg-muted/30 p-3">
                <div className="mb-1 flex items-center gap-2 text-xs text-muted-foreground">
                  <Mail className="h-3.5 w-3.5" />
                  Bekleyen
                </div>
                <div className="text-2xl font-bold">{campaign.pending}</div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {campaign.withEmail} e-postalı · {campaign.noEmail} e-postasız
                </p>
              </div>
              <div className="rounded-lg border bg-muted/30 p-3">
                <div className="mb-1 flex items-center gap-2 text-xs text-muted-foreground">
                  <MailWarning className="h-3.5 w-3.5" />
                  Tamamlanma
                </div>
                <div className="text-2xl font-bold">
                  {campaign.total ? Math.round((campaign.mailSent / campaign.total) * 100) : 0}%
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
