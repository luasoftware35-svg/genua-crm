import { NextResponse } from "next/server";
import { getSignaturePreview } from "@/lib/mail-signature";
import { createClient } from "@/lib/supabase/server";
import { getTitanMailConfig } from "@/lib/titan-mail";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Oturum gerekli" }, { status: 401 });
  }

  const config = getTitanMailConfig();
  const signature = getSignaturePreview();
  return NextResponse.json({
    configured: config.configured,
    from: config.from,
    fromName: config.fromName,
    signatureText: signature.text,
    signatureLogoUrl: "/email/genua-signature.png",
  });
}
