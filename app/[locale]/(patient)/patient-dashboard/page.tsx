import React from "react";
import { PatientProfileSummary } from "@/components/patient/PatientProfileSummary";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { HeartPulse, ShieldAlert } from "lucide-react";

export default function PatientDashboardPage() {
  const samplePatient = {
    id: "pat_001",
    userId: "usr_001",
    name: "Ramesh Sharma",
    dateOfBirth: "1985-06-15",
    gender: "MALE" as const,
    contactNo: "+91 98765 43210",
    abhaNumber: "14-5542-8921-3410",
    dominantPrakriti: "Vata-Pitta (वात-पित्त)",
  };

  return (
    <div className="space-y-6">
      <PatientProfileSummary patient={samplePatient} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HeartPulse className="h-5 w-5 text-ayush-green" />
              Recent Consultations & Prescriptions
            </CardTitle>
            <CardDescription>Records linked with your ABHA ID</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="p-3 border rounded-lg bg-muted/20 flex justify-between items-center">
              <div>
                <p className="font-semibold text-sm">AIIA Delhi - OPD Consultation</p>
                <p className="text-xs text-muted-foreground">Dr. A. K. Joshi (Ayurveda) • 20 Aug 2026</p>
              </div>
              <Button variant="outline" size="sm">View Rx</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-blue-600" />
              ABDM Consent Requests
            </CardTitle>
            <CardDescription>Manage electronic health record sharing permissions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="p-3 border rounded-lg bg-blue-50/50 border-blue-200 flex justify-between items-center">
              <div>
                <p className="font-semibold text-sm">All India Institute of Ayurveda</p>
                <p className="text-xs text-muted-foreground">Request for OPD Consultation records (Valid for 1 month)</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">Deny</Button>
                <Button variant="ayush" size="sm">Grant</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
