"use client";

import { useState } from "react";
import { Loader2, ScanSearch } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCrm } from "@/context/crm-context";
import type { Company } from "@/types";

export function SiteAuditButton({ company }: { company: Company }) {
  const { updateCompany } = useCrm();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runAudit = async () => {
    if (!company.website) {
      setError("Önce firma web sitesi ekleyin.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/audit/website", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: company.website }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Denetim başarısız");

      updateCompany(company.id, {
        audit_status: data.audit_status,
        audit_findings: data.findings,
        audit_impact: data.impact,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Denetim başarısız");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <Button variant="secondary" size="sm" disabled={loading || !company.website} onClick={runAudit}>
        {loading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <ScanSearch className="mr-2 h-4 w-4" />
        )}
        Site Denetimi Çalıştır
      </Button>
      {error && <p className="text-sm text-destructive">{error}</p>}
      {!company.website && (
        <p className="text-xs text-muted-foreground">Web sitesi olmadan otomatik denetim yapılamaz.</p>
      )}
    </div>
  );
}
