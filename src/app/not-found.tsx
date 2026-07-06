import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
      <h1 className="text-4xl font-bold">404</h1>
      <p className="text-muted-foreground">Sayfa veya firma bulunamadı.</p>
      <Button asChild>
        <Link href="/dashboard">Dashboard&apos;a Dön</Link>
      </Button>
    </div>
  );
}
