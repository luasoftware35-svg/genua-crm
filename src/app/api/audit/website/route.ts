import { NextResponse } from "next/server";
import { auditWebsite } from "@/lib/site-audit";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Oturum gerekli" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const url = typeof body.url === "string" ? body.url : "";

    if (!url.trim()) {
      return NextResponse.json({ error: "URL gerekli" }, { status: 400 });
    }

    const result = await auditWebsite(url);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Denetim başarısız" }, { status: 500 });
  }
}
