import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    service: "Ayush Patient Case-Taking Platform",
    abdmReady: true,
  });
}
