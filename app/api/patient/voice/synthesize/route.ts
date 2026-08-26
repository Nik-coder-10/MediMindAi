import { NextRequest } from "next/server";
import { z } from "zod";
import { apiSuccess, apiError } from "@/lib/api/response";
import { VoiceService } from "@/lib/ai/voice";

const synthesizeSchema = z.object({
  text: z.string().min(1, "text is required"),
  language: z.string().default("hi-IN"),
  voiceGender: z.enum(["FEMALE", "MALE"]).default("FEMALE"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = synthesizeSchema.parse(body);
    const result = await VoiceService.synthesizeSpeech(validated);
    return apiSuccess(result, 200);
  } catch (error) {
    return apiError(error);
  }
}
