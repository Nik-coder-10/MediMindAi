"use client";

import React, { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Stethoscope, User, Shield, KeyRound, Phone, Sparkles, CheckCircle2, ArrowRight } from "lucide-react";

export default function LoginPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || `/${locale}`;

  const [activeTab, setActiveTab] = useState<"patient" | "doctor">("patient");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Patient states
  const [phone, setPhone] = useState("+91 98765 43210");
  const [otp, setOtp] = useState("123456");
  const [otpSent, setOtpSent] = useState(false);
  const [abhaId, setAbhaId] = useState("14-5542-8921-3410");

  // Doctor/Admin states
  const [email, setEmail] = useState("dr.rajesh.vaidya@aiia.gov.in");
  const [password, setPassword] = useState("AyushDoctor@2026");
  const [role, setRole] = useState<"DOCTOR" | "ADMIN">("DOCTOR");

  const handlePatientPhoneLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await signIn("phone-otp", {
        phone,
        otp,
        redirect: false,
      });
      if (res?.error) {
        setError("Invalid OTP or Phone Number. Use demo OTP: 123456");
      } else {
        router.push(`/${locale}/patient/consent`);
      }
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
      const res = await signIn("abha-login", {
        abhaIdOrAddress: abhaId,
        redirect: false,
      });
      if (res?.error) {
        setError("Failed to link ABHA profile.");
      } else {
        router.push(`/${locale}/patient/consent`);
      }
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
      const res = await signIn("credentials", {
        email,
        password,
        role,
        redirect: false,
      });
      if (res?.error) {
        setError("Invalid credentials. Please verify your registration number and password.");
      } else {
        router.push(role === "ADMIN" ? `/${locale}/admin/admin-dashboard` : `/${locale}/doctor/consultation`);
      }
    } catch {
      setError("Authentication failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container max-w-2xl py-12 space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
          <span>🌿</span> Ministry of Ayush & AIIA Digital Portal
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight">AyurSetu Secure Login</h1>
        <p className="text-sm text-muted-foreground">Select your portal to proceed with ABDM-compliant clinical access.</p>
      </div>

      {/* Role Selection Tabs */}
      <div className="grid grid-cols-2 gap-3 p-1.5 bg-muted rounded-xl">
        <button
          type="button"
          onClick={() => { setActiveTab("patient"); setError(null); }}
          className={`flex items-center justify-center gap-2 py-3 text-sm font-semibold rounded-lg transition-all min-h-[48px] ${
            activeTab === "patient" ? "bg-background shadow text-foreground" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <User className="h-4 w-4 text-emerald-600" />
          <span>Patient Portal (रोगी पोर्टल)</span>
        </button>
        <button
          type="button"
          onClick={() => { setActiveTab("doctor"); setError(null); }}
          className={`flex items-center justify-center gap-2 py-3 text-sm font-semibold rounded-lg transition-all min-h-[48px] ${
            activeTab === "doctor" ? "bg-background shadow text-foreground" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Stethoscope className="h-4 w-4 text-blue-600" />
          <span>Doctor / Vaidya (चिकित्सक)</span>
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-destructive/10 border border-destructive text-destructive text-sm font-medium">
          {error}
        </div>
      )}

      {/* PATIENT LOGIN CARD */}
      {activeTab === "patient" && (
        <div className="space-y-6">
          <Card className="border shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="h-5 w-5 text-emerald-600" />
                Mobile Number + OTP Verification
              </CardTitle>
              <CardDescription>Enter registered mobile number for instant Ayush consultation access</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePatientPhoneLogin} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Mobile Number</label>
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
                    className="w-full"
                    onClick={() => setOtpSent(true)}
                  >
                    <span>Get Verification OTP</span>
                  </Button>
                ) : (
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center">
                        <label className="text-xs font-semibold text-muted-foreground">Enter 6-Digit OTP</label>
                        <span className="text-xs text-emerald-600 font-semibold">Demo OTP: 123456</span>
                      </div>
                      <Input
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        placeholder="123456"
                        maxLength={6}
                        required
                      />
                    </div>
                    <Button type="submit" variant="ayush" className="w-full" disabled={loading}>
                      {loading ? "Authenticating..." : "Verify OTP & Continue"}
                    </Button>
                  </div>
                )}
              </form>
            </CardContent>
            <CardFooter className="flex flex-col gap-3 border-t pt-4 bg-muted/20">
              <div className="flex items-center gap-2 w-full">
                <div className="flex-1 h-px bg-border" />
                <span className="text-xs text-muted-foreground font-semibold">OR CONNECT WITH ABHA</span>
                <div className="flex-1 h-px bg-border" />
              </div>
              <Button
                variant="outline"
                onClick={handleAbhaQuickLogin}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 border-emerald-300 bg-emerald-50/50 hover:bg-emerald-100"
              >
                <Shield className="h-4 w-4 text-emerald-700" />
                <span className="font-semibold text-emerald-900">Simulate ABHA Card Login (14-5542-8921-3410)</span>
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}

      {/* DOCTOR / ADMIN LOGIN CARD */}
      {activeTab === "doctor" && (
        <Card className="border shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-blue-600" />
              Ayush Practitioner Credentials
            </CardTitle>
            <CardDescription>Access clinical desk and NAMASTE terminology registry</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleDoctorLogin} className="space-y-4">
              <div className="flex gap-4 p-2 bg-muted/40 rounded-lg">
                <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                  <input
                    type="radio"
                    name="role"
                    checked={role === "DOCTOR"}
                    onChange={() => { setRole("DOCTOR"); setEmail("dr.rajesh.vaidya@aiia.gov.in"); }}
                  />
                  <span>Ayush Vaidya / Doctor</span>
                </label>
                <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                  <input
                    type="radio"
                    name="role"
                    checked={role === "ADMIN"}
                    onChange={() => { setRole("ADMIN"); setEmail("admin@ayush.gov.in"); }}
                  />
                  <span>Ministry / Admin</span>
                </label>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Official Email / CCIM Reg Number</label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="doctor@aiia.gov.in"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Password</label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <Button type="submit" variant="default" className="w-full bg-slate-900 text-white hover:bg-slate-800" disabled={loading}>
                {loading ? "Verifying..." : `Login as ${role === "ADMIN" ? "Admin" : "Doctor"}`}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
