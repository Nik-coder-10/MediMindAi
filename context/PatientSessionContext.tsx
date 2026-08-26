"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

interface PatientSessionState {
  sessionId: string;
  language: string;
  clinicalMode: "GENERAL" | "AYURVEDA";
  chiefComplaint: string;
  currentStep: number;
  answers: Record<string, unknown>;
  uploadedDocuments: Array<{ name: string; size: string }>;
  setLanguage: (lang: string) => void;
  setClinicalMode: (mode: "GENERAL" | "AYURVEDA") => void;
  setChiefComplaint: (complaint: string) => void;
  setAnswer: (key: string, value: unknown) => void;
  addDocument: (doc: { name: string; size: string }) => void;
  setCurrentStep: (step: number) => void;
  resetSession: () => void;
}

const PatientSessionContext = createContext<PatientSessionState | undefined>(undefined);

export function PatientSessionProvider({ children }: { children: React.ReactNode }) {
  const [sessionId, setSessionId] = useState<string>("sess-demo-001");
  const [language, setLanguageState] = useState<string>("hi");
  const [clinicalMode, setClinicalModeState] = useState<"GENERAL" | "AYURVEDA">("AYURVEDA");
  const [chiefComplaint, setChiefComplaintState] = useState<string>("");
  const [currentStep, setCurrentStepState] = useState<number>(1);
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [uploadedDocuments, setUploadedDocuments] = useState<Array<{ name: string; size: string }>>([]);

  // Load from LocalStorage on mount for recovery
  useEffect(() => {
    try {
      const saved = localStorage.getItem("ayursetu_patient_session");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.sessionId) setSessionId(parsed.sessionId);
        if (parsed.language) setLanguageState(parsed.language);
        if (parsed.clinicalMode) setClinicalModeState(parsed.clinicalMode);
        if (parsed.chiefComplaint) setChiefComplaintState(parsed.chiefComplaint);
        if (parsed.answers) setAnswers(parsed.answers);
        if (parsed.uploadedDocuments) setUploadedDocuments(parsed.uploadedDocuments);
      }
    } catch {
      // Local storage unparsed
    }
  }, []);

  // Save to LocalStorage on change
  useEffect(() => {
    try {
      localStorage.setItem(
        "ayursetu_patient_session",
        JSON.stringify({
          sessionId,
          language,
          clinicalMode,
          chiefComplaint,
          answers,
          uploadedDocuments,
        })
      );
    } catch {
      // Local storage full/blocked
    }
  }, [sessionId, language, clinicalMode, chiefComplaint, answers, uploadedDocuments]);

  const setLanguage = (lang: string) => setLanguageState(lang);
  const setClinicalMode = (mode: "GENERAL" | "AYURVEDA") => setClinicalModeState(mode);
  const setChiefComplaint = (comp: string) => setChiefComplaintState(comp);
  const setAnswer = (key: string, val: unknown) => setAnswers((prev) => ({ ...prev, [key]: val }));
  const addDocument = (doc: { name: string; size: string }) => setUploadedDocuments((prev) => [...prev, doc]);
  const setCurrentStep = (step: number) => setCurrentStepState(step);
  const resetSession = () => {
    localStorage.removeItem("ayursetu_patient_session");
    setSessionId(`sess-${Date.now()}`);
    setChiefComplaintState("");
    setAnswers({});
    setUploadedDocuments([]);
  };

  return (
    <PatientSessionContext.Provider
      value={{
        sessionId,
        language,
        clinicalMode,
        chiefComplaint,
        currentStep,
        answers,
        uploadedDocuments,
        setLanguage,
        setClinicalMode,
        setChiefComplaint,
        setAnswer,
        addDocument,
        setCurrentStep,
        resetSession,
      }}
    >
      {children}
    </PatientSessionContext.Provider>
  );
}

export function usePatientSession() {
  const context = useContext(PatientSessionContext);
  if (!context) {
    throw new Error("usePatientSession must be used within PatientSessionProvider");
  }
  return context;
}
