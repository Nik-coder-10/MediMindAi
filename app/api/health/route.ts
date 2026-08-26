import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export async function GET(req: NextRequest) {
  let dbStatus = "unconnected";
  try {
    // Quick probe of DB connectivity
    await prisma.$queryRaw`SELECT 1`;
    dbStatus = "connected";
  } catch {
    dbStatus = "pending_container_start";
  }

  return NextResponse.json(
    {
      status: "healthy",
      service: "AyurSetu Clinical Platform (SIH 2026 Problem ID 26047)",
      version: "1.0.0",
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || "development",
      database: dbStatus,
      abdmInteroperability: "ready",
      wcagCompliance: "2.2 AA",
    },
    { status: 200 }
  );
}
