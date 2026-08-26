import React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Database, ShieldCheck, Activity, Users } from "lucide-react";

export default function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Consultations</CardDescription>
            <CardTitle className="text-3xl font-bold">12,450</CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-xs text-emerald-600 font-semibold">+18% from last month</span>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>ABHA Linked Records</CardDescription>
            <CardTitle className="text-3xl font-bold">98.4%</CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-xs text-blue-600 font-semibold">12,250 Verified</span>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Dominant Morbidity</CardDescription>
            <CardTitle className="text-2xl font-bold">Amavata / Sandhigata</CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-xs text-amber-600 font-semibold">NAMASTE: NAM-AY-0412</span>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Registered Ayush Doctors</CardDescription>
            <CardTitle className="text-3xl font-bold">142</CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-xs text-purple-600 font-semibold">Ayurveda / Siddha / Unani</span>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
