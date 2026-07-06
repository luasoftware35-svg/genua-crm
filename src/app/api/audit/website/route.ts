import { NextResponse } from "next/server";
import { auditWebsite } from "@/lib/site-audit";

export async function POST(request: Request) {
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
