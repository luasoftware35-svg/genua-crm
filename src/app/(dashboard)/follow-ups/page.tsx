import { FollowUpsClient } from "@/components/follow-ups/follow-ups-client";

export default function FollowUpsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Takipler</h1>
        <p className="text-muted-foreground">Bugün ve bu hafta takip edilmesi gereken firmalar</p>
      </div>
      <FollowUpsClient />
    </div>
  );
}
