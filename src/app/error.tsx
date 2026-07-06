"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-6">
      <h1 className="text-2xl font-bold">Bir hata oluştu</h1>
      <p className="max-w-md text-center text-muted-foreground text-sm">
        {error.message || "Sayfa yüklenirken beklenmeyen bir sorun oluştu."}
      </p>
      <div className="flex gap-3">
        <Button onClick={() => reset()}>Tekrar Dene</Button>
        <Button variant="outline" asChild>
          <Link href="/dashboard">Dashboard</Link>
        </Button>
      </div>
    </div>
  );
}
