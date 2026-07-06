import { AppSidebar, MobileNav } from "@/components/layout/app-sidebar";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <AppSidebar />
      <main className="flex-1 overflow-auto">
        <div className="flex h-14 items-center border-b px-4 md:hidden">
          <MobileNav />
          <span className="ml-3 font-semibold">Genua CRM</span>
        </div>
        <div className="container mx-auto max-w-7xl p-6 md:p-8">{children}</div>
      </main>
    </div>
  );
}
