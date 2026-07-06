"use client";

import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink, FileText, Mail, MapPin, Phone, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ActivitySection } from "@/components/companies/activity-section";
import { AuditForm } from "@/components/companies/audit-form";
import { CompanyForm } from "@/components/companies/company-form";
import { ContactsSection } from "@/components/companies/contacts-section";
import { DealPanel } from "@/components/companies/deal-panel";
import { getAuditStatusColor, getAuditStatusLabel } from "@/lib/constants";
import { cityToSlug } from "@/lib/cities";
import { useCrm } from "@/context/crm-context";

export function CompanyDetailClient({ id }: { id: string }) {
  const { getCompanyById, getDealByCompanyId, deleteCompany } = useCrm();
  const company = getCompanyById(id);

  if (!company) notFound();

  const deal = getDealByCompanyId(company.id);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/companies">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">{company.name}</h1>
          <p className="text-muted-foreground">
            {company.city ?? "—"} · {company.source ?? "—"} · {company.sector ?? "Sektör belirtilmemiş"}
          </p>
        </div>
        <Badge className={getAuditStatusColor(company.audit_status)}>
          {getAuditStatusLabel(company.audit_status)}
        </Badge>
        <Button
          variant="outline"
          size="sm"
          className="text-destructive"
          onClick={() => {
            if (confirm(`"${company.name}" silinsin mi?`)) {
              deleteCompany(company.id);
              window.location.href = "/companies";
            }
          }}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Sil
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {company.website && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">Web Sitesi</CardTitle>
            </CardHeader>
            <CardContent>
              <a
                href={company.website.startsWith("http") ? company.website : `https://${company.website}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-sm font-medium hover:underline truncate"
              >
                {company.website.replace(/^https?:\/\//, "")}
                <ExternalLink className="h-3 w-3 shrink-0" />
              </a>
            </CardContent>
          </Card>
        )}
        {company.email && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                <Mail className="h-3 w-3" /> E-posta
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm font-medium truncate">{company.email}</p>
            </CardContent>
          </Card>
        )}
        {company.phone && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                <Phone className="h-3 w-3" /> Telefon
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm font-medium">{company.phone}</p>
            </CardContent>
          </Card>
        )}
        {company.audit_pdf_name && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                <FileText className="h-3 w-3" /> Kaynak PDF
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm font-medium truncate">{company.audit_pdf_name}</p>
            </CardContent>
          </Card>
        )}
        {company.city && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                <MapPin className="h-3 w-3" /> Şehir
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Link href={`/cities/${cityToSlug(company.city)}`} className="text-sm font-medium hover:underline">
                {company.city}
              </Link>
            </CardContent>
          </Card>
        )}
      </div>

      {(company.audit_findings || company.audit_impact) && (
        <Card>
          <CardHeader>
            <CardTitle>Denetim Özeti</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {company.audit_findings && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Bulgular</p>
                <p className="text-sm whitespace-pre-wrap">{company.audit_findings}</p>
              </div>
            )}
            {company.audit_impact && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">İş Etkisi</p>
                <p className="text-sm whitespace-pre-wrap">{company.audit_impact}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <CompanyForm company={company} />
        {deal ? <DealPanel deal={deal} /> : null}
      </div>

      <AuditForm company={company} />

      <div className="grid gap-6 lg:grid-cols-2">
        <ContactsSection companyId={company.id} />
        <ActivitySection companyId={company.id} dealId={deal?.id} />
      </div>
    </div>
  );
}
