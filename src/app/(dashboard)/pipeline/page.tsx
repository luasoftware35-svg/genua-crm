import { PipelineClient } from "@/components/pipeline/pipeline-client";

export default function PipelinePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Pipeline</h1>
        <p className="text-muted-foreground">
          Aktif kampanyalarınızı aşamalara göre takip edin; kartları sürükleyerek güncelleyin
        </p>
      </div>
      <PipelineClient />
    </div>
  );
}
