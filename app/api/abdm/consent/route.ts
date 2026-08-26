import { NextRequest, NextResponse } from "next/server";
import { consentManager } from "@/lib/consent/abdm-manager";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = await consentManager.requestConsent(body);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to process ABDM consent request" }, { status: 500 });
  }
}
