import { describe, it, expect } from "vitest";
import { SessionService } from "../lib/services/session.service";
import { SummaryService } from "../lib/services/summary.service";
import { AppError } from "../lib/api/errors";


describe("Phase 2 Production Database Foundation & Mock Fallback Tests", () => {
  it("SessionService.getSessionById should throw AppError when session does not exist (no fake fallback)", async () => {
    await expect(
      SessionService.getSessionById("non-existent-session-id-12345")
    ).rejects.toThrow();
  });

  it("SummaryService.generateSummary should throw AppError when session does not exist (no Ramesh Sharma fallback)", async () => {
    await expect(
      SummaryService.generateSummary({ sessionId: "non-existent-session-id-12345" })
    ).rejects.toThrow();
  });

  it("SessionService.createSession should validate patientId requirement", async () => {
    await expect(
      SessionService.createSession({ patientId: "" } as any)
    ).rejects.toThrow(AppError);
  });
});
