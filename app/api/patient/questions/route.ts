import { NextRequest } from "next/server";
import { z } from "zod";
import { apiSuccess, apiError } from "@/lib/api/response";
import { AdaptiveQuestionGenerator } from "@/lib/engine/adaptive-question-generator";

const generateQuestionsSchema = z.object({
  chiefComplaint: z.string().min(1, "chiefComplaint is required"),
  language: z.enum(["hi", "en"]).default("hi"),
  sessionId: z.string().optional(),
  alreadyCollectedFacts: z.record(z.unknown()).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = generateQuestionsSchema.parse(body);

    const result = await AdaptiveQuestionGenerator.generateQuestions({
      chiefComplaint: validated.chiefComplaint,
      language: validated.language,
      sessionId: validated.sessionId,
      alreadyCollectedFacts: validated.alreadyCollectedFacts,
    });

    return apiSuccess(result, 200);
  } catch (error) {
    return apiError(error);
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const chiefComplaint = searchParams.get("chiefComplaint") || "General checkup";
    const language = (searchParams.get("language") as "hi" | "en") || "hi";
    const sessionId = searchParams.get("sessionId") || undefined;

    const result = await AdaptiveQuestionGenerator.generateQuestions({
      chiefComplaint,
      language,
      sessionId,
    });

    return apiSuccess(result, 200);
  } catch (error) {
    return apiError(error);
  }
}
