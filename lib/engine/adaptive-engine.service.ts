import { prisma } from "@/lib/db/prisma";
import { AppError } from "@/lib/api/errors";
import { defaultQuestionProvider } from "./question-provider";
import { RedFlagService } from "@/lib/services/redflag.service";
import { AdaptiveQuestionGenerator } from "./adaptive-question-generator";
import { dynamicQuestionNodes } from "./dynamic-registry";
import {
  ComplaintCategory,
  EngineStateDTO,
  CollectedFacts,
  EngineQuestionDefinition,
} from "./types";
import { TriagePriority } from "@prisma/client";

// In-memory state cache fallback for resilience
const inMemoryEngineStates: Map<string, EngineStateDTO> = new Map();

function mapCategoryToDTO(cat: string): ComplaintCategory {
  switch (cat) {
    case "Musculoskeletal":
      return "JOINT_PAIN";
    case "Chest Pain":
      return "CHEST_PAIN";
    case "Headache":
      return "HEADACHE";
    case "Abdominal Pain":
      return "ABDOMINAL_PAIN";
    case "Fever":
      return "FEVER";
    default:
      return "GENERAL";
  }
}

export class AdaptiveEngineService {
  /**
   * Starts a new clinical question session for a chief complaint
   */
  static async startSession(
    sessionId: string,
    chiefComplaintText: string,
    language: "hi" | "en" = "hi"
  ): Promise<{ state: EngineStateDTO; firstQuestion: EngineQuestionDefinition | null }> {
    if (!sessionId || !chiefComplaintText) {
      throw AppError.badRequest("sessionId and chiefComplaintText are required");
    }

    // 1. Generate dynamic tailored adaptive questions based on chief complaint
    const dynamicGen = await AdaptiveQuestionGenerator.generateQuestions({
      chiefComplaint: chiefComplaintText,
      language,
      sessionId,
    });

    const category = mapCategoryToDTO(dynamicGen.category);

    // 2. Register dynamic question chain in dynamic nodes registry
    let firstNode: EngineQuestionDefinition | null = null;
    const questions = dynamicGen.questions;

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      const nextQ = questions[i + 1];

      const nodeDef: EngineQuestionDefinition = {
        nodeCode: q.id,
        chiefComplaintCategory: category,
        clinicalDomain: `SOCRATES_${q.clinicalPurpose.toUpperCase()}`,
        questionText: q.textEn,
        questionTextHindi: q.text,
        questionType: q.type === "scale" ? "SINGLE_CHOICE" : (q.type.toUpperCase() as any),
        options: (q.options || []).map((opt) => {
          if (typeof opt === "string") {
            return { value: opt, labelHi: opt, labelEn: opt };
          }
          return opt;
        }),
        nextRules: nextQ ? [{ targetNodeCode: nextQ.id }] : [],
      };

      dynamicQuestionNodes.set(q.id, nodeDef);

      if (i === 0) {
        firstNode = nodeDef;
      }
    }

    // If dynamic questions were empty (fallback), query provider
    if (!firstNode) {
      firstNode = await defaultQuestionProvider.getFirstNodeForCategory(category);
    }

    const initialFacts: CollectedFacts = {
      category,
      answers: { chiefComplaint: chiefComplaintText, detectedProblems: dynamicGen.detectedProblems },
      triggeredRedFlags: [],
    };

    let engineState: EngineStateDTO = {
      sessionId,
      category,
      currentNodeCode: firstNode?.nodeCode || null,
      questionCount: 0,
      maxQuestions: Math.max(questions.length, 10),
      triageLevel: "ROUTINE",
      isPaused: false,
      completed: false,
      collectedFacts: initialFacts,
    };

    inMemoryEngineStates.set(sessionId, engineState);

    try {
      await prisma.engineState.upsert({
        where: { sessionId },
        create: {
          sessionId,
          category,
          currentNodeId: firstNode?.nodeCode || null,
          collectedFacts: initialFacts as any,
          questionHistory: [] as any,
          questionCount: 0,
          maxQuestions: 10,
          triageLevel: TriagePriority.ROUTINE,
          isPaused: false,
          completed: false,
        },
        update: {
          category,
          currentNodeId: firstNode?.nodeCode || null,
          collectedFacts: initialFacts as any,
          isPaused: false,
          completed: false,
        },
      });

      // Persist ChiefComplaint relation if valid session exists
      const existingComplaint = await prisma.chiefComplaint.findFirst({
        where: { sessionId },
      });
      if (!existingComplaint) {
        await prisma.chiefComplaint.create({
          data: {
            sessionId,
            symptomName: chiefComplaintText,
            duration: "2-3 days",
            severity: "MODERATE",
          },
        });
      }
    } catch {
      // In-memory cached
    }

    return { state: engineState, firstQuestion: firstNode };
  }


  /**
   * Processes an answer from patient, updates facts, evaluates safety red flags, and returns next question
   */
  static async processAnswer(
    sessionId: string,
    nodeCode: string,
    answerValue: unknown
  ): Promise<{
    state: EngineStateDTO;
    nextQuestion: EngineQuestionDefinition | null;
    redFlagAlert?: { ruleId: string; description: string; severity: string } | null;
  }> {
    if (!sessionId || !nodeCode) {
      throw AppError.badRequest("sessionId and nodeCode are required");
    }

    let existingState: EngineStateDTO | null = await this.getCurrentState(sessionId);
    if (!existingState) {
      existingState = {
        sessionId,
        category: "CHEST_PAIN",
        currentNodeCode: nodeCode,
        questionCount: 0,
        maxQuestions: 10,
        triageLevel: "ROUTINE",
        isPaused: false,
        completed: false,
        collectedFacts: { answers: {} },
      };
    }

    const currentNode = await defaultQuestionProvider.getNodeByCode(nodeCode);
    if (!currentNode) {
      throw AppError.notFound(`Question node ${nodeCode} not found in engine tree`);
    }

    // 1. Update collected facts
    const updatedFacts: CollectedFacts = {
      ...existingState.collectedFacts,
      answers: {
        ...(existingState.collectedFacts?.answers || {}),
        [nodeCode]: answerValue,
      },
    };

    // Update SOCRATES / Ayush / History facets
    if (currentNode.clinicalDomain.includes("SEVERITY")) {
      updatedFacts.socrates = { ...(updatedFacts.socrates || {}), severity: answerValue as any };
    }
    if (currentNode.clinicalDomain.includes("RADIATION")) {
      updatedFacts.socrates = { ...(updatedFacts.socrates || {}), radiation: answerValue as string };
    }
    if (currentNode.clinicalDomain.includes("CHARACTER")) {
      updatedFacts.socrates = { ...(updatedFacts.socrates || {}), character: answerValue as string };
    }
    if (currentNode.clinicalDomain.includes("FAMILY_HISTORY") || nodeCode.startsWith("FH_")) {
      updatedFacts.familyHistory = {
        ...(updatedFacts.familyHistory || {}),
        [nodeCode]: answerValue as string,
        summaryText: `${updatedFacts.familyHistory?.summaryText || ""}; ${nodeCode}: ${answerValue}`.trim().replace(/^;\s*/, ""),
      };
    }
    if (currentNode.clinicalDomain.includes("SOCIAL_HISTORY") || nodeCode.startsWith("SOC_")) {
      updatedFacts.socialHistory = {
        ...(updatedFacts.socialHistory || {}),
        [nodeCode]: answerValue as string,
        summaryText: `${updatedFacts.socialHistory?.summaryText || ""}; ${nodeCode}: ${answerValue}`.trim().replace(/^;\s*/, ""),
      };
    }
    if (currentNode.clinicalDomain.includes("OBSTETRIC") || nodeCode.startsWith("OBS_")) {
      updatedFacts.obstetricHistory = {
        ...(updatedFacts.obstetricHistory || {}),
        applicable: true,
        [nodeCode]: answerValue as string,
        summaryText: `${updatedFacts.obstetricHistory?.summaryText || ""}; ${nodeCode}: ${answerValue}`.trim().replace(/^;\s*/, ""),
      };
    }

    // 2. Evaluate Red Flag rules
    let redFlagAlert: { ruleId: string; description: string; severity: string } | null = null;
    let triageLevel = existingState.triageLevel;

    if (currentNode.redFlagTriggers) {
      for (const rule of currentNode.redFlagTriggers) {
        if (
          answerValue === rule.expectedValue ||
          (Array.isArray(answerValue) && answerValue.includes(rule.expectedValue))
        ) {
          redFlagAlert = {
            ruleId: rule.ruleId,
            description: rule.description,
            severity: rule.severity,
          };
          updatedFacts.triggeredRedFlags = [
            ...(updatedFacts.triggeredRedFlags || []),
            redFlagAlert,
          ];
          triageLevel = rule.severity === "CRITICAL" ? "EMERGENCY" : "URGENT";

          await RedFlagService.evaluateAndTrigger({
            sessionId,
            ruleId: rule.ruleId,
            description: rule.description,
            severity: rule.severity as any,
          });
        }
      }
    }

    // 3. Determine next node in tree
    const nextNodeCode = defaultQuestionProvider.getNextNodeCode(
      currentNode,
      answerValue,
      updatedFacts
    );
    const nextQuestion = nextNodeCode
      ? await defaultQuestionProvider.getNodeByCode(nextNodeCode)
      : null;

    const isCompleted =
      !nextQuestion || existingState.questionCount + 1 >= existingState.maxQuestions;

    const newState: EngineStateDTO = {
      ...existingState,
      currentNodeCode: nextQuestion?.nodeCode || null,
      questionCount: existingState.questionCount + 1,
      triageLevel,
      collectedFacts: updatedFacts,
      completed: isCompleted,
    };

    inMemoryEngineStates.set(sessionId, newState);

    // 4. Persist updated state & answer
    try {
      await prisma.patientAnswer.create({
        data: {
          sessionId,
          nodeCode,
          answerValue: answerValue as any,
        },
      });

      await prisma.engineState.update({
        where: { sessionId },
        data: {
          currentNodeId: newState.currentNodeCode,
          collectedFacts: newState.collectedFacts as any,
          questionCount: newState.questionCount,
          triageLevel: newState.triageLevel as any,
          completed: newState.completed,
        },
      });
    } catch {
      // In-memory cache handles state
    }

    return {
      state: newState,
      nextQuestion,
      redFlagAlert,
    };
  }

  /**
   * Retrieves live state for an active session
   */
  static async getCurrentState(sessionId: string): Promise<EngineStateDTO | null> {
    try {
      const state = await prisma.engineState.findUnique({
        where: { sessionId },
      });
      if (state) {
        return {
          sessionId: state.sessionId,
          category: state.category as ComplaintCategory,
          currentNodeCode: state.currentNodeId,
          questionCount: state.questionCount,
          maxQuestions: state.maxQuestions,
          triageLevel: state.triageLevel as any,
          isPaused: state.isPaused,
          completed: state.completed,
          collectedFacts: state.collectedFacts as CollectedFacts,
        };
      }
    } catch {
      // Fall through to in-memory map
    }

    return inMemoryEngineStates.get(sessionId) || null;
  }

  /**
   * Pauses the active question session
   */
  static async pauseSession(sessionId: string): Promise<boolean> {
    const memState = inMemoryEngineStates.get(sessionId);
    if (memState) {
      memState.isPaused = true;
      inMemoryEngineStates.set(sessionId, memState);
    }

    try {
      await prisma.engineState.update({
        where: { sessionId },
        data: { isPaused: true },
      });
      return true;
    } catch {
      return true;
    }
  }

  /**
   * Resumes a paused question session
   */
  static async resumeSession(sessionId: string): Promise<boolean> {
    const memState = inMemoryEngineStates.get(sessionId);
    if (memState) {
      memState.isPaused = false;
      inMemoryEngineStates.set(sessionId, memState);
    }

    try {
      await prisma.engineState.update({
        where: { sessionId },
        data: { isPaused: false },
      });
      return true;
    } catch {
      return true;
    }
  }
}
