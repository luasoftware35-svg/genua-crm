import { CompaniesTable } from "@/components/companies/companies-table";

export default function CompaniesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Hedef Müşteriler</h1>
        <p className="text-muted-foreground">
          Genua Digital outreach listesi — PDF yükleyin, firmaları tek tek görün, detaya tıklayın
        </p>
      </div>
      <CompaniesTable />
    </div>
  );
}
