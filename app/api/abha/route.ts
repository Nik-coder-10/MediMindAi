import { NextRequest } from "next/server";
import { z } from "zod";
import { apiSuccess, apiError } from "@/lib/api/response";
import { AbhaMockService } from "@/lib/auth/abha-mock-service";

const linkAbhaSchema = z.object({
  phone: z.string().optional(),
  name: z.string().optional(),
  otp: z.string().length(6, "OTP must be 6 digits").optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = linkAbhaSchema.parse(body);
    const generated = AbhaMockService.generateAbha(validated.phone, validated.name);
    return apiSuccess({
      status: "LINKED",
      abha: generated,
      kycVerified: true,
      linkedAt: new Date().toISOString(),
    }, 200);
  } catch (error) {
    return apiError(error);
  }
}
