import { NextRequest } from "next/server";
import { z } from "zod";
import { apiSuccess, apiError } from "@/lib/api/response";
import { prisma } from "@/lib/db/prisma";
import { AuditService } from "@/lib/services/audit.service";
import { QuestionNodeType } from "@/lib/engine/types";

import { dynamicQuestionNodes } from "@/lib/engine/dynamic-registry";

const createNodeSchema = z.object({
  chiefComplaintCategory: z.string().min(1),
  nodeCode: z.string().min(1),
  questionText: z.string().min(1),
  questionTextHindi: z.string().min(1),
  questionType: z.enum(["TEXT", "SINGLE_CHOICE", "MULTI_CHOICE", "SCALE", "YES_NO"]).default("SINGLE_CHOICE"),
  clinicalDomain: z.string().default("GENERAL"),
  options: z.array(z.record(z.unknown())).optional(),
  redFlagTriggers: z.array(z.record(z.unknown())).optional(),
  nextRules: z.array(z.record(z.unknown())).optional(),
  isActive: z.boolean().default(true),
});

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");

    let dbNodes: any[] = [];
    try {
      dbNodes = await prisma.questionNode.findMany({
        where: category ? { chiefComplaintCategory: category } : undefined,
      });
    } catch {
      // In-memory fallback
    }

    const allNodes = [...Array.from(dynamicQuestionNodes.values()), ...dbNodes];
    return apiSuccess({ count: allNodes.length, nodes: allNodes });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = createNodeSchema.parse(body);

    dynamicQuestionNodes.set(validated.nodeCode, validated);

    let created: any = null;
    try {
      created = await prisma.questionNode.upsert({
        where: { nodeCode: validated.nodeCode },
        create: {
          nodeCode: validated.nodeCode,
          chiefComplaintCategory: validated.chiefComplaintCategory,
          questionText: validated.questionText,
          questionTextHindi: validated.questionTextHindi,
          questionType: validated.questionType as any,
          clinicalDomain: validated.clinicalDomain,
          options: validated.options as any,
          redFlagTriggers: validated.redFlagTriggers as any,
          nextNodeLogic: validated.nextRules as any,
        },
        update: {
          questionText: validated.questionText,
          questionTextHindi: validated.questionTextHindi,
          options: validated.options as any,
          redFlagTriggers: validated.redFlagTriggers as any,
        },
      });
    } catch {
      // In-memory stored
    }

    await AuditService.log({
      action: "ADMIN_UPSERT_QUESTION_NODE",
      resourceType: "QuestionNode",
      resourceId: created?.id || validated.nodeCode,
      metadata: { nodeCode: validated.nodeCode, category: validated.chiefComplaintCategory },
    });

    return apiSuccess({ status: "SAVED", node: validated }, 201);
  } catch (error) {
    return apiError(error);
  }
}
