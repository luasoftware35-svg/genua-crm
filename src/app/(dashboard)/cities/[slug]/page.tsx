import { CityDetailClient } from "@/components/cities/city-detail-client";

export default function CityDetailPage({ params }: { params: { slug: string } }) {
  return <CityDetailClient slug={params.slug} />;
}
