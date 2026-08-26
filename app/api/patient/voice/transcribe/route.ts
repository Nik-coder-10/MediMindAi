import { NextRequest } from "next/server";
import { z } from "zod";
import { apiSuccess, apiError } from "@/lib/api/response";
import { VoiceService } from "@/lib/ai/voice";
import { ConversationService } from "@/lib/services/conversation.service";

const transcribeSchema = z.object({
  audioBase64: z.string().optional(),
  language: z.string().default("hi-IN"),
  sessionId: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") || "";
    let language = "hi-IN";
    let sessionId: string | undefined;
    let audioBuffer = Buffer.from([]);

    if (contentType.includes("application/json")) {
      const body = await req.json();
      const validated = transcribeSchema.parse(body);
      language = validated.language;
      sessionId = validated.sessionId;
      if (validated.audioBase64) {
        audioBuffer = Buffer.from(validated.audioBase64, "base64");
      }
    } else {
      const arrayBuf = await req.arrayBuffer();
      audioBuffer = Buffer.from(arrayBuf);
      const url = new URL(req.url);
      language = url.searchParams.get("language") || "hi-IN";
      sessionId = url.searchParams.get("sessionId") || undefined;
    }

    const result = await VoiceService.transcribeAudio(audioBuffer, {
      language,
      sessionId,
    });

    // Record turn if sessionId is present
    if (sessionId && result.transcript) {
      await ConversationService.recordTurn({
        sessionId,
        role: "PATIENT",
        contentText: result.transcript,
        contentAudioUrl: result.audioUrl,
        metadata: { confidence: result.confidence, language: result.detectedLanguage },
      });
    }

    return apiSuccess(result, 200);
  } catch (error) {
    return apiError(error);
  }
}
