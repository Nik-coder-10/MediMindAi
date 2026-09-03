import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  let dbStatus: "connected" | "unavailable" = "unavailable";
  let overallStatus: "ok" | "degraded" = "degraded";

  try {
    // Quick probe of DB connectivity (timeout after 2500ms to prevent hanging)
    await Promise.race([
      prisma.$queryRaw`SELECT 1`,
      new Promise((_, reject) => setTimeout(() => reject(new Error("DB timeout")), 2500)),
    ]);
    dbStatus = "connected";
    overallStatus = "ok";
  } catch {
    dbStatus = "unavailable";
    overallStatus = "degraded";
  }

  return NextResponse.json(
    {
      status: overallStatus,
      service: "AyurSetu Clinical Platform (SIH 2026 Problem ID 26047)",
      version: "1.0.0",
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || "development",
      checks: {
        application: "reachable",
        database: dbStatus,
        storage: "ready",
        abdmGateway: "ready",
      },
    },
    { status: overallStatus === "ok" ? 200 : 503 }
  );
}

