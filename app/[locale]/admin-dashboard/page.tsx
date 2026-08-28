"use client";

import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ExtraLargeButton } from "@/components/ui/patient/ExtraLargeButton";
import {
  ShieldAlert,

  Settings,
  HelpCircle,
  Activity,
  Plus,
  Edit2,
  CheckCircle2,
  AlertTriangle,
  Sliders,
  BarChart3,
  Layers,
  Lock,
  Globe,
  Loader2,
  Save,
  LogIn,
  Building,
} from "lucide-react";
import { motion } from "framer-motion";
import { useAuthStore } from "@/stores/use-auth-store";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function AdminClinicalConfigPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const router = useRouter();
  const { isAuthenticated, user, loginAsAdmin } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<"QUESTIONS" | "RULES" | "SETTINGS" | "ANALYTICS">("QUESTIONS");
  const [nodes, setNodes] = useState<any[]>([]);
  const [rules, setRules] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>({
    voiceEnabled: true,
    ayushModeEnabled: true,
    maxQuestionsPerSession: 12,
    autoTriageEmergencyDispatch: true,
  });
  const [loading, setLoading] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isAdmin = isAuthenticated && user?.role === "ADMIN";

  // New Node Form State
  const [newNodeCategory, setNewNodeCategory] = useState("CHEST_PAIN");
  const [newNodeCode, setNewNodeCode] = useState("");
  const [newNodeTextEn, setNewNodeTextEn] = useState("");
  const [newNodeTextHi, setNewNodeTextHi] = useState("");

  const fetchData = async () => {
    setLoading(true);
    try {
      const nData = await (await fetch("/api/admin/nodes")).json();
      const rData = await (await fetch("/api/admin/rules")).json();
      const sData = await (await fetch("/api/admin/settings")).json();

      if (nData.data?.nodes) setNodes(nData.data.nodes);
      if (rData.data?.rules) setRules(rData.data.rules);
      if (sData.data) setSettings(sData.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (mounted && isAdmin) {
      fetchData();
    }
  }, [mounted, isAdmin]);

  if (!mounted) {
    return <div className="min-h-[80vh] flex items-center justify-center p-4" />;
  }


  // Ministry Admin Authentication Gate
  if (!isAdmin) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-6 sm:p-8 rounded-3xl border-2 border-amber-400 space-y-5 text-center shadow-xl bg-card">
          <div className="w-14 h-14 bg-amber-100 dark:bg-amber-950 text-amber-700 rounded-full flex items-center justify-center mx-auto text-2xl">
            🏛️
          </div>
          <div className="space-y-1.5">
            <h2 className="text-xl font-black text-foreground">प्रशासक लॉगिन आवश्यक (Ministry Admin Required)</h2>
            <p className="text-xs text-muted-foreground font-semibold">
              The clinical engine manager, red-flag safety rulebook, and national health analytics require authorized Ministry of Ayush Admin credentials.
            </p>
          </div>

          <div className="space-y-2 pt-2">
            <Button
              className="w-full font-extrabold min-h-[46px] flex items-center justify-center gap-2 bg-amber-700 hover:bg-amber-800 text-white"
              onClick={() => router.push(`/${locale}/login?role=admin`)}
            >
              <LogIn className="h-4 w-4" />
              <span>Login as Ministry / Admin</span>
            </Button>

            <Button
              variant="outline"
              className="w-full text-xs font-bold border-amber-300 bg-amber-50/50 dark:bg-amber-950/20"
              onClick={() => {
                loginAsAdmin({
                  name: "Dr. S. K. Narayanan (Joint Director)",
                  adminEmployeeId: "AYUSH-GOV-ID-2026-881",
                  adminMinistryDept: "Ministry of Ayush, Govt. of India",
                  adminDesignation: "National Nodal Officer & Clinical Admin",
                });
              }}
            >
              <span>⚡ Quick Demo Login (Ministry Admin • Nodal Officer)</span>
            </Button>

            <div className="pt-2 border-t text-2xs text-muted-foreground">
              <span>Looking for doctor consultation desk? </span>
              <button
                type="button"
                onClick={() => router.push(`/${locale}/doctor`)}
                className="text-blue-700 font-bold underline"
              >
                Go to Doctor Portal →
              </button>
            </div>
          </div>
        </Card>
      </div>
    );
  }


  const handleCreateNode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNodeCode || !newNodeTextEn || !newNodeTextHi) return;

    setLoading(true);
    try {
      const payload = {
        chiefComplaintCategory: newNodeCategory,
        nodeCode: newNodeCode,
        questionText: newNodeTextEn,
        questionTextHindi: newNodeTextHi,
        questionType: "SINGLE_CHOICE",
        clinicalDomain: "ADMIN_CONFIG",
        options: [
          { value: "YES", labelHi: "हाँ (Yes)", labelEn: "Yes" },
          { value: "NO", labelHi: "नहीं (No)", labelEn: "No" },
        ],
      };

      const res = await fetch("/api/admin/nodes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      setNodes((prev) => [...prev, data.data.node]);
      setNewNodeCode("");
      setNewNodeTextEn("");
      setNewNodeTextHi("");
      setActionSuccess(`प्रश्न नोड [${payload.nodeCode}] सफलतापूर्वक जोड़ा गया (Node Created)`);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    setLoading(true);
    try {
      await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      setActionSuccess("सिस्टम सेटिंग्स व फीचर फ्लैग्स सहेजे गए (Settings Saved)");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container max-w-7xl py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-4">
        <div>
          <span className="text-xs font-extrabold px-3 py-1 bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-300 rounded-full inline-flex items-center gap-1.5 border border-amber-300">
            <Lock className="h-3.5 w-3.5" /> व्यवस्थापक नियंत्रण कक्ष (Admin Clinical Console)
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground mt-1">
            क्लिनिकल इंजन प्रबंधन (Dynamic Content Manager)
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground font-medium">
            Configure decision trees, safety red-flag rules, lab reference ranges, and feature flags without code redeploy.
          </p>
        </div>

        {actionSuccess && (
          <div className="text-xs font-extrabold px-3 py-1.5 rounded-xl bg-emerald-100 text-emerald-900 border border-emerald-300 flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <span>{actionSuccess}</span>
          </div>
        )}
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto border-b pb-2">
        {[
          { id: "QUESTIONS", label: "प्रश्न वृक्ष (Question Trees)", icon: <Layers className="h-4 w-4" /> },
          { id: "RULES", label: "रेड-फ्लैग नियम (Red-Flag Rules)", icon: <AlertTriangle className="h-4 w-4" /> },
          { id: "SETTINGS", label: "फीचर फ्लैग्स (Feature Flags)", icon: <Sliders className="h-4 w-4" /> },
          { id: "ANALYTICS", label: "उपयोग एनालिटिक्स (Analytics)", icon: <BarChart3 className="h-4 w-4" /> },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id as any)}
            className={`min-h-[44px] px-4 rounded-2xl text-xs font-extrabold inline-flex items-center gap-2 transition-all ${
              activeTab === tab.id
                ? "bg-ayush-green text-white shadow-xs"
                : "bg-card text-muted-foreground hover:text-foreground border"
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab 1: Question Tree Manager */}
      {activeTab === "QUESTIONS" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Create Question Node Card */}
          <Card className="p-6 rounded-3xl border-2 border-input space-y-4 bg-card h-fit shadow-sm">
            <h3 className="text-base font-extrabold text-foreground flex items-center gap-2">
              <Plus className="h-4 w-4 text-emerald-600" />
              <span>नया प्रश्न नोड जोड़ें (Add Question)</span>
            </h3>

            <form onSubmit={handleCreateNode} className="space-y-3 text-left">
              <div>
                <label className="text-xs font-bold text-muted-foreground block mb-1">मुख्य श्रेणी (Category)</label>
                <select
                  value={newNodeCategory}
                  onChange={(e) => setNewNodeCategory(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-input text-xs font-semibold bg-background"
                >
                  <option value="CHEST_PAIN">Chest Pain (छाती में दर्द)</option>
                  <option value="HEADACHE">Headache (सिरदर्द)</option>
                  <option value="FEVER">Fever (बुखार)</option>
                  <option value="ABDOMINAL_PAIN">Abdominal Pain (पेट दर्द)</option>
                  <option value="JOINT_PAIN">Joint Pain (जोड़ों का दर्द)</option>
                  <option value="GENERAL">General / AYUSH (आयुर्वेद)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-muted-foreground block mb-1">नोड कोड (Node Code)</label>
                <input
                  type="text"
                  placeholder="e.g. CP_PALPITATIONS"
                  value={newNodeCode}
                  onChange={(e) => setNewNodeCode(e.target.value.toUpperCase())}
                  className="w-full p-2.5 rounded-xl border border-input text-xs font-semibold font-mono"
                  required
                >
                </input>
              </div>

              <div>
                <label className="text-xs font-bold text-muted-foreground block mb-1">अंग्रेज़ी प्रश्न (English Prompt)</label>
                <input
                  type="text"
                  placeholder="Are you experiencing sudden palpitations?"
                  value={newNodeTextEn}
                  onChange={(e) => setNewNodeTextEn(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-input text-xs font-semibold"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-muted-foreground block mb-1">हिंदी प्रश्न (Hindi Prompt)</label>
                <input
                  type="text"
                  placeholder="क्या आपको अचानक दिल की धड़कन तेज महसूस हो रही है?"
                  value={newNodeTextHi}
                  onChange={(e) => setNewNodeTextHi(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-input text-xs font-semibold"
                  required
                />
              </div>

              <ExtraLargeButton variant="primary" size="default" className="w-full mt-2" disabled={loading}>
                {loading ? "सहेज रहे हैं..." : "नोड सहेजें (Save Node)"}
              </ExtraLargeButton>
            </form>
          </Card>

          {/* Active Question Nodes Table */}
          <div className="lg:col-span-2 space-y-3">
            <h3 className="text-base font-extrabold text-foreground">सक्रिय प्रश्न नोड्स (Active Nodes • {nodes.length})</h3>
            <div className="grid grid-cols-1 gap-2.5">
              {nodes.map((node) => (
                <div
                  key={node.nodeCode}
                  className="p-4 rounded-2xl bg-card border-2 border-input hover:border-emerald-400 transition-all space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-extrabold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-foreground">
                      {node.nodeCode}
                    </span>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                      {node.chiefComplaintCategory}
                    </span>
                  </div>
                  <div className="text-sm font-extrabold text-foreground">{node.questionTextHindi}</div>
                  <div className="text-xs text-muted-foreground font-semibold">{node.questionText}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Red Flag Rules Manager */}
      {activeTab === "RULES" && (
        <div className="space-y-4">
          <h3 className="text-base font-extrabold text-foreground">
            सक्रिय रेड-फ्लैग सुरक्षा नियम (Safety Red-Flag Registry • {rules.length})
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {rules.map((rule) => (
              <div
                key={rule.ruleId}
                className="p-4 rounded-2xl bg-card border-2 border-rose-200 dark:border-rose-900 space-y-2 shadow-2xs"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-extrabold text-rose-800 dark:text-rose-300">{rule.ruleId}</span>
                  <span className="text-xs font-extrabold px-2 py-0.5 rounded-full bg-rose-600 text-white">
                    {rule.severity}
                  </span>
                </div>
                <p className="text-xs font-bold text-foreground">{rule.description}</p>
                <div className="text-xs font-mono text-muted-foreground">
                  ट्रिगर शर्त: <span className="font-semibold text-foreground">{rule.field} == {String(rule.expectedValue)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: System Feature Flags & Settings */}
      {activeTab === "SETTINGS" && (
        <Card className="p-6 sm:p-8 rounded-3xl border-2 border-input space-y-6 max-w-2xl bg-card shadow-sm">
          <h3 className="text-base font-extrabold text-foreground flex items-center gap-2">
            <Sliders className="h-4 w-4 text-emerald-600" />
            <span>सिस्टम फीचर फ्लैग्स व सीमाएं (Runtime Constraints)</span>
          </h3>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-xl border bg-slate-50 dark:bg-slate-900">
              <div>
                <div className="text-sm font-extrabold text-foreground">आवाज इनपुट सक्षम (Voice Layer Enabled)</div>
                <div className="text-xs text-muted-foreground font-semibold">Whisper ASR & TTS active on patient portal</div>
              </div>
              <input
                type="checkbox"
                checked={settings.voiceEnabled}
                onChange={(e) => setSettings({ ...settings, voiceEnabled: e.target.checked })}
                className="w-5 h-5 rounded accent-emerald-600"
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl border bg-slate-50 dark:bg-slate-900">
              <div>
                <div className="text-sm font-extrabold text-foreground">आयुर्वेद परामर्श मोड (AYUSH Mode Enabled)</div>
                <div className="text-xs text-muted-foreground font-semibold">Enable Charaka Samhita Dashavidha Pariksha</div>
              </div>
              <input
                type="checkbox"
                checked={settings.ayushModeEnabled}
                onChange={(e) => setSettings({ ...settings, ayushModeEnabled: e.target.checked })}
                className="w-5 h-5 rounded accent-emerald-600"
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl border bg-slate-50 dark:bg-slate-900">
              <div>
                <div className="text-sm font-extrabold text-foreground">अधिकतम प्रश्न सीमा (Max Questions Per Session)</div>
                <div className="text-xs text-muted-foreground font-semibold">Prevents patient fatigue during intake</div>
              </div>
              <input
                type="number"
                value={settings.maxQuestionsPerSession}
                onChange={(e) => setSettings({ ...settings, maxQuestionsPerSession: parseInt(e.target.value) || 10 })}
                className="w-20 p-2 text-center rounded-lg border text-xs font-bold"
                min={4}
                max={30}
              />
            </div>
          </div>

          <ExtraLargeButton
            variant="primary"
            size="default"
            icon={<Save className="h-4 w-4" />}
            onClick={handleSaveSettings}
            disabled={loading}
          >
            सेटिंग्स सहेजें (Save Changes)
          </ExtraLargeButton>
        </Card>
      )}

      {/* Tab 4: Basic Analytics Overview */}
      {activeTab === "ANALYTICS" && (
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <Card className="p-5 rounded-2xl border-2 border-emerald-300 bg-emerald-50/50 space-y-1">
            <span className="text-xs font-bold text-emerald-800 uppercase">आज के परामर्श (Sessions Today)</span>
            <div className="text-3xl font-extrabold text-emerald-950">142</div>
            <span className="text-xs text-muted-foreground font-semibold">+18% from yesterday</span>
          </Card>

          <Card className="p-5 rounded-2xl border-2 border-rose-300 bg-rose-50/50 space-y-1">
            <span className="text-xs font-bold text-rose-800 uppercase">रेड-फ्लैग दर (Red-Flag Rate)</span>
            <div className="text-3xl font-extrabold text-rose-950">8.4%</div>
            <span className="text-xs text-muted-foreground font-semibold">12 emergency alerts routed</span>
          </Card>

          <Card className="p-5 rounded-2xl border-2 border-amber-300 bg-amber-50/50 space-y-1">
            <span className="text-xs font-bold text-amber-800 uppercase">आयुर्वेद मोड चयन (AYUSH Mode)</span>
            <div className="text-3xl font-extrabold text-amber-950">64%</div>
            <span className="text-xs text-muted-foreground font-semibold">91 Dashavidha assessments</span>
          </Card>

          <Card className="p-5 rounded-2xl border-2 border-blue-300 bg-blue-50/50 space-y-1">
            <span className="text-xs font-bold text-blue-800 uppercase">औसत समय (Avg Intake Time)</span>
            <div className="text-3xl font-extrabold text-blue-950">3.8 m</div>
            <span className="text-xs text-muted-foreground font-semibold">Under 4 min per patient</span>
          </Card>
        </div>
      )}
    </div>
  );
}
