import { NextRequest, NextResponse } from "next/server";
import { ConsentService } from "@/lib/consent/service";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = await ConsentService.revokeConsent(body.patientId, body.reason);
    return NextResponse.json(result, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Failed to revoke consent" }, { status: 500 });
  }
}
