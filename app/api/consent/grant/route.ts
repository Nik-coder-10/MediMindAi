import { NextRequest, NextResponse } from "next/server";
import { ConsentService } from "@/lib/consent/service";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = await ConsentService.grantConsent(body);
    return NextResponse.json(result, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to record consent" }, { status: 500 });
  }
}
