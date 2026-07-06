"use client";

import Link from "next/link";
import { Building2, ChevronRight, MapPin } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useCrm } from "@/context/crm-context";

export function CitiesClient() {
  const { getCities, getCityContacts } = useCrm();
  const cities = getCities();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Şehirler</h1>
        <p className="text-muted-foreground">
          Şehir seç → firmalar, iletişim listesi ve toplu gönderim
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cities.map((city) => {
          const contactCount = getCityContacts(city.name).length;
          return (
            <Link key={city.slug} href={`/cities/${city.slug}`}>
              <Card className="transition-colors hover:bg-accent hover:border-primary/30">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-primary" />
                    <CardTitle>{city.name}</CardTitle>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <CardDescription className="flex gap-4 text-sm">
                    <span className="flex items-center gap-1">
                      <Building2 className="h-3.5 w-3.5" />
                      {city.count} firma
                    </span>
                    <span>{contactCount} kişi</span>
                  </CardDescription>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {cities.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Henüz şehir yok. PDF veya CSV ile firma ekleyin.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
