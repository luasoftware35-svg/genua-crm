"use client";

import { CrmProvider } from "@/context/crm-context";
import { DashboardLayout } from "@/components/layout/dashboard-layout";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <CrmProvider>
      <DashboardLayout>{children}</DashboardLayout>
    </CrmProvider>
  );
}
