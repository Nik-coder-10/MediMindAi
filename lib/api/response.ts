import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { AppError } from "./errors";

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta?: {
    timestamp: string;
    version: string;
    [key: string]: unknown;
  };
}

export function apiSuccess<T>(data: T, status: number = 200, meta?: Record<string, unknown>) {
  const responseBody: ApiResponse<T> = {
    success: true,
    data,
    meta: {
      timestamp: new Date().toISOString(),
      version: "v1",
      ...meta,
    },
  };
  return NextResponse.json(responseBody, { status });
}

export function apiError(error: unknown) {
  if (error instanceof AppError) {
    const responseBody: ApiResponse = {
      success: false,
      error: {
        code: error.code,
        message: error.message,
        details: error.details,
      },
      meta: {
        timestamp: new Date().toISOString(),
        version: "v1",
      },
    };
    return NextResponse.json(responseBody, { status: error.statusCode });
  }

  if (error instanceof ZodError) {
    const responseBody: ApiResponse = {
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Invalid request payload",
        details: error.errors.map((e) => ({
          path: e.path.join("."),
          message: e.message,
        })),
      },
      meta: {
        timestamp: new Date().toISOString(),
        version: "v1",
      },
    };
    return NextResponse.json(responseBody, { status: 400 });
  }

  const isProd = process.env.NODE_ENV === "production";
  let genericMessage = "Internal server error";
  if (!isProd && error instanceof Error) {
    genericMessage = error.message;
  } else if (error instanceof Error && !error.message.includes("prisma") && !error.message.includes("database") && !error.message.includes("select") && !error.message.includes("connect")) {
    genericMessage = error.message;
  }

  const responseBody: ApiResponse = {
    success: false,
    error: {
      code: "INTERNAL_SERVER_ERROR",
      message: genericMessage,
    },
    meta: {
      timestamp: new Date().toISOString(),
      version: "v1",
    },
  };
  return NextResponse.json(responseBody, { status: 500 });
}
