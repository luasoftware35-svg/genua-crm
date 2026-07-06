"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    document.cookie = "genua-auth=1; path=/; max-age=604800";
    window.location.href = "/companies";
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground text-xl font-bold">
            G
          </div>
          <CardTitle className="text-2xl">Genua Digital CRM</CardTitle>
          <CardDescription>
            <a href="https://www.genuadigital.com" target="_blank" rel="noopener noreferrer" className="hover:underline">
              genuadigital.com
            </a>
            {" "}— hedef müşteri paneli
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-posta</Label>
              <Input
                id="email"
                type="email"
                placeholder="umut@genua.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Şifre</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full">
              Giriş Yap
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              Supabase Auth sonraki adımda. Şimdilik herhangi bir e-posta/şifre ile giriş yapabilirsiniz.
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
