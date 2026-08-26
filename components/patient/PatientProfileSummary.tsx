import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { PatientProfile } from "@/types/patient";
import { User, Shield, Phone, Calendar } from "lucide-react";

interface Props {
  patient: PatientProfile;
}

export function PatientProfileSummary({ patient }: Props) {
  return (
    <Card className="border-l-4 border-l-ayush-green shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-bold flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            {patient.name}
          </CardTitle>
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200">
            <Shield className="h-3 w-3" />
            ABHA: {patient.abhaNumber || "Verified"}
          </span>
        </div>
      </CardHeader>
      <CardContent className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span>DOB: {patient.dateOfBirth} ({patient.gender})</span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Phone className="h-4 w-4" />
          <span>{patient.contactNo || "+91 98765 43210"}</span>
        </div>
        <div>
          <span className="font-semibold text-foreground">Dominant Prakriti: </span>
          <span className="text-ayush-green font-bold">{patient.dominantPrakriti || "Vata-Pitta"}</span>
        </div>
      </CardContent>
    </Card>
  );
}
