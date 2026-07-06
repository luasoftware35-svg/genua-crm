import { CompanyDetailClient } from "@/components/companies/company-detail-client";

export default function CompanyDetailPage({ params }: { params: { id: string } }) {
  return <CompanyDetailClient id={params.id} />;
}
