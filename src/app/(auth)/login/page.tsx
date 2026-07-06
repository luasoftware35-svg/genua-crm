"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const allowSignUp = process.env.NEXT_PUBLIC_ALLOW_SIGNUP === "true";

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
        <p className="text-sm text-muted-foreground">Yükleniyor...</p>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const searchParams = useSearchParams();
  const authError = searchParams.get("error") === "auth";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();

    if (isSignUp) {
      if (!allowSignUp) {
        setError("Yeni hesap oluşturma kapalı. Yöneticinizle iletişime geçin.");
        setLoading(false);
        return;
      }
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (signUpError) {
        setError(signUpError.message);
        setLoading(false);
        return;
      }
      setError(null);
      alert("Hesap oluşturuldu. E-posta doğrulaması gerekiyorsa gelen kutunuzu kontrol edin, ardından giriş yapın.");
      setIsSignUp(false);
      setLoading(false);
      return;
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError(signInError.message);
      setLoading(false);
      return;
    }

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
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {(error || authError) && (
              <p className="text-sm text-destructive">
                {error ?? "Oturum doğrulaması başarısız. Tekrar giriş yapın."}
              </p>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Bekleyin..." : isSignUp ? "Hesap Oluştur" : "Giriş Yap"}
            </Button>
            {allowSignUp && (
              <Button
                type="button"
                variant="ghost"
                className="w-full text-sm"
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setError(null);
                }}
              >
                {isSignUp ? "Zaten hesabınız var mı? Giriş yapın" : "İlk kurulum — hesap oluştur"}
              </Button>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
