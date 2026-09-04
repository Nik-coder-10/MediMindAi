"use client";

import React, { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Stethoscope, User, Shield, KeyRound, Phone, Sparkles, CheckCircle2, ArrowRight, Lock, Building, FileCheck } from "lucide-react";
import { useAuthStore } from "@/stores/use-auth-store";
import { AyurSetuLogo } from "@/components/shared/AyurSetuLogo";

export default function LoginPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || `/${locale}`;
  const initialTab = searchParams.get("role") === "admin" ? "admin" : searchParams.get("role") === "doctor" ? "doctor" : "patient";

  const { loginAsPatient, loginAsDoctor, loginAsAdmin } = useAuthStore();

  const [activeTab, setActiveTab] = useState<"patient" | "doctor" | "admin">(initialTab as any);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Patient states
  const [phone, setPhone] = useState("+91 98765 43210");
  const [otp, setOtp] = useState("123456");
  const [otpSent, setOtpSent] = useState(false);
  const [patientName, setPatientName] = useState("Ramesh Sharma");
  const [abhaId, setAbhaId] = useState("14-5542-8921-3410");

  // Doctor states
  const [doctorName, setDoctorName] = useState("Dr. Arvind K. Sharma (MD, BAMS)");
  const [doctorRegNumber, setDoctorRegNumber] = useState("AYUSH-REG-DL-2024-9842");
  const [doctorHospital, setDoctorHospital] = useState("All India Institute of Ayurveda (AIIA), New Delhi");
  const [doctorSpecialty, setDoctorSpecialty] = useState("Senior Vaidya & Consultant Physician");
  const [doctorEmail, setDoctorEmail] = useState("dr.rajesh.vaidya@aiia.gov.in");
  const [doctorPassword, setDoctorPassword] = useState("AyushDoctor@2026");

  // Admin / Ministry states
  const [adminName, setAdminName] = useState("Dr. S. K. Narayanan (Joint Director)");
  const [adminEmployeeId, setAdminEmployeeId] = useState("AYUSH-GOV-ID-2026-881");
  const [adminMinistryDept, setAdminMinistryDept] = useState("Ministry of Ayush, Govt. of India");
  const [adminDesignation, setAdminDesignation] = useState("National Nodal Officer & Clinical Admin");
  const [adminEmail, setAdminEmail] = useState("director.ayush@nic.in");
  const [adminPassword, setAdminPassword] = useState("MinistryAdmin@2026");

  const handlePatientPhoneLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      loginAsPatient({
        name: patientName,
        phone,
        abhaId,
        age: 42,
        gender: "MALE",
        bloodGroup: "B+",
      });
      router.push(`/${locale}/patient/consent`);
    } catch {
      setError("An unexpected error occurred during login.");
    } finally {
      setLoading(false);
    }
  };

  const handleAbhaQuickLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      loginAsPatient({
        name: "Ramesh Sharma",
        phone: "+91 98765 43210",
        abhaId: abhaId.trim() || "14-5542-8921-3410",
        age: 42,
        gender: "MALE",
        bloodGroup: "B+",
      });
      router.push(`/${locale}/patient/consent`);
    } catch {
      setError("ABHA authentication service error.");
    } finally {
      setLoading(false);
    }
  };

  const handleDoctorLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      loginAsDoctor({
        name: doctorName,
        doctorRegNumber,
        hospitalName: doctorHospital.trim(),
        specialization: doctorSpecialty,
        email: doctorEmail,
      });
      router.push(`/${locale}/doctor`);
    } catch {
      setError("Doctor authentication failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      loginAsAdmin({
        name: adminName,
        adminEmployeeId,
        adminMinistryDept,
        adminDesignation,
        email: adminEmail,
      });
      router.push(`/${locale}/admin-dashboard`);
    } catch {
      setError("Ministry Admin authentication failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container max-w-2xl py-12 space-y-8">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="flex justify-center">
          <AyurSetuLogo size="lg" />
        </div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300">
          <span>🌿</span> Ministry of Ayush & AIIA Digital Portal · A MediMindAI Project
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground">AyurSetu Secure Login</h1>
        <p className="text-sm text-muted-foreground">Select your portal to proceed with ABDM-compliant clinical access.</p>
      </div>

      {/* Role Selection 3-Tabs */}
      <div className="grid grid-cols-3 gap-2 p-1.5 bg-muted rounded-2xl">
        <button
          type="button"
          onClick={() => { setActiveTab("patient"); setError(null); }}
          className={`flex flex-col sm:flex-row items-center justify-center gap-1.5 py-3 px-2 text-xs sm:text-sm font-extrabold rounded-xl transition-all min-h-[48px] ${
            activeTab === "patient" ? "bg-background shadow text-emerald-800 dark:text-emerald-300 border" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <User className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>Patient PHR</span>
        </button>

        <button
          type="button"
          onClick={() => { setActiveTab("doctor"); setError(null); }}
          className={`flex flex-col sm:flex-row items-center justify-center gap-1.5 py-3 px-2 text-xs sm:text-sm font-extrabold rounded-xl transition-all min-h-[48px] ${
            activeTab === "doctor" ? "bg-background shadow text-blue-800 dark:text-blue-300 border" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Stethoscope className="h-4 w-4 text-blue-600 shrink-0" />
          <span>Doctor Desk</span>
        </button>

        <button
          type="button"
          onClick={() => { setActiveTab("admin"); setError(null); }}
          className={`flex flex-col sm:flex-row items-center justify-center gap-1.5 py-3 px-2 text-xs sm:text-sm font-extrabold rounded-xl transition-all min-h-[48px] ${
            activeTab === "admin" ? "bg-background shadow text-amber-800 dark:text-amber-300 border" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Lock className="h-4 w-4 text-amber-600 shrink-0" />
          <span>Admin / Ministry</span>
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-destructive/10 border border-destructive text-destructive text-sm font-medium">
          {error}
        </div>
      )}

      {/* 1. PATIENT LOGIN CARD */}
      {activeTab === "patient" && (
        <div className="space-y-6">
          <Card className="border shadow-md rounded-3xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="h-5 w-5 text-emerald-600" />
                <span>Patient ABHA & OTP Verification</span>
              </CardTitle>
              <CardDescription>
                Login with registered phone or ABHA Card to fetch your health records and consult or register grievances
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePatientPhoneLogin} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-muted-foreground uppercase">Patient Full Name</label>
                    <Input
                      value={patientName}
                      onChange={(e) => setPatientName(e.target.value)}
                      placeholder="e.g. Ramesh Sharma"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-muted-foreground uppercase">ABHA ID (National Health ID)</label>
                    <Input
                      value={abhaId}
                      onChange={(e) => setAbhaId(e.target.value)}
                      placeholder="14-5542-8921-3410"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase">Registered Mobile Number</label>
                  <Input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    required
                  />
                </div>

                {!otpSent ? (
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full font-bold min-h-[44px]"
                    onClick={() => setOtpSent(true)}
                  >
                    <span>Get Verification OTP (ओटीपी प्राप्त करें)</span>
                  </Button>
                ) : (
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center">
                        <label className="text-xs font-bold text-muted-foreground uppercase">Enter 6-Digit OTP</label>
                        <span className="text-xs text-emerald-600 font-bold">Demo OTP: 123456</span>
                      </div>
                      <Input
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        placeholder="123456"
                        maxLength={6}
                        required
                      />
                    </div>
                    <Button type="submit" variant="ayush" className="w-full font-extrabold min-h-[46px]" disabled={loading}>
                      {loading ? "Authenticating..." : "सत्यापित करें व केस दर्ज करें (Verify & Continue)"}
                    </Button>
                  </div>
                )}
              </form>
            </CardContent>
            <CardFooter className="flex flex-col gap-3 border-t pt-4 bg-muted/20 rounded-b-3xl">
              <div className="flex items-center gap-2 w-full">
                <div className="flex-1 h-px bg-border" />
                <span className="text-2xs text-muted-foreground font-extrabold uppercase">OR 1-CLICK ABHA LINKAGE</span>
                <div className="flex-1 h-px bg-border" />
              </div>
              <Button
                variant="outline"
                onClick={handleAbhaQuickLogin}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 border-emerald-300 bg-emerald-50/50 dark:bg-emerald-950/30 hover:bg-emerald-100 min-h-[46px]"
              >
                <Shield className="h-4 w-4 text-emerald-700" />
                <span className="font-extrabold text-xs text-emerald-900 dark:text-emerald-200">
                  ⚡ ABHA कार्ड से सीधे लॉगिन करें (Simulate ABHA Profile: {abhaId})
                </span>
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}

      {/* 2. DOCTOR / VAIDYA LOGIN CARD */}
      {activeTab === "doctor" && (
        <Card className="border shadow-md rounded-3xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Stethoscope className="h-5 w-5 text-blue-600" />
              <span>Ayush Medical Practitioner Login (चिकित्सक पोर्टल)</span>
            </CardTitle>
            <CardDescription>
              Enter medical board registration number and hospital/clinic details to access clinical consultations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleDoctorLogin} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase">Doctor Name & Degree</label>
                  <Input
                    value={doctorName}
                    onChange={(e) => setDoctorName(e.target.value)}
                    placeholder="e.g. Dr. Arvind K. Sharma (MD, BAMS)"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase">Medical Board Reg No (CCIM/State)</label>
                  <Input
                    value={doctorRegNumber}
                    onChange={(e) => setDoctorRegNumber(e.target.value)}
                    placeholder="e.g. AYUSH-REG-DL-2024-9842"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase">
                  Hospital / Clinic / Firm (अस्पताल का नाम - Leave blank if private practice)
                </label>
                <Input
                  value={doctorHospital}
                  onChange={(e) => setDoctorHospital(e.target.value)}
                  placeholder="All India Institute of Ayurveda (AIIA), New Delhi"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase">Designation / Specialty</label>
                  <Input
                    value={doctorSpecialty}
                    onChange={(e) => setDoctorSpecialty(e.target.value)}
                    placeholder="Senior Vaidya & Consultant Physician"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase">Institutional Email</label>
                  <Input
                    type="email"
                    value={doctorEmail}
                    onChange={(e) => setDoctorEmail(e.target.value)}
                    placeholder="doctor@aiia.gov.in"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase">Password</label>
                <Input
                  type="password"
                  value={doctorPassword}
                  onChange={(e) => setDoctorPassword(e.target.value)}
                  required
                />
              </div>

              <Button type="submit" variant="default" className="w-full bg-blue-700 hover:bg-blue-800 text-white font-extrabold min-h-[46px]" disabled={loading}>
                {loading ? "Verifying..." : "चिकित्सक पोर्टल खोलें (Login as Doctor)"}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="border-t pt-3 bg-muted/20 text-2xs text-muted-foreground font-semibold flex items-center justify-between rounded-b-3xl">
            <span>* Doctors may also switch to patient mode to register test grievances</span>
            <button
              type="button"
              onClick={() => setActiveTab("patient")}
              className="text-emerald-700 font-bold underline"
            >
              Patient Login & Grievance →
            </button>
          </CardFooter>
        </Card>
      )}

      {/* 3. MINISTRY / ADMIN LOGIN CARD */}
      {activeTab === "admin" && (
        <Card className="border shadow-md rounded-3xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-amber-600" />
              <span>Ministry of Ayush / Admin Console (प्रशासक लॉगिन)</span>
            </CardTitle>
            <CardDescription>
              Government admin portal for dynamic question trees, safety red-flags, and national analytics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAdminLogin} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase">Admin Officer Name</label>
                  <Input
                    value={adminName}
                    onChange={(e) => setAdminName(e.target.value)}
                    placeholder="e.g. Dr. S. K. Narayanan"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase">Government Nodal ID / Employee ID</label>
                  <Input
                    value={adminEmployeeId}
                    onChange={(e) => setAdminEmployeeId(e.target.value)}
                    placeholder="AYUSH-GOV-ID-2026-881"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase">Ministry / Department Division</label>
                <Input
                  value={adminMinistryDept}
                  onChange={(e) => setAdminMinistryDept(e.target.value)}
                  placeholder="Ministry of Ayush, Govt. of India"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase">Official NIC / GOV Email</label>
                  <Input
                    type="email"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    placeholder="director.ayush@nic.in"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase">Admin Designation</label>
                  <Input
                    value={adminDesignation}
                    onChange={(e) => setAdminDesignation(e.target.value)}
                    placeholder="National Nodal Officer & Clinical Admin"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase">Password</label>
                <Input
                  type="password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  required
                />
              </div>

              <Button type="submit" variant="default" className="w-full bg-amber-700 hover:bg-amber-800 text-white font-extrabold min-h-[46px]" disabled={loading}>
                {loading ? "Verifying..." : "प्रशासक नियंत्रण कक्ष खोलें (Login as Ministry Admin)"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

