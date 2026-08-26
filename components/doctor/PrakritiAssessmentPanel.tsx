"use client";

import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Activity, Sparkles } from "lucide-react";

export function PrakritiAssessmentPanel() {
  return (
    <Card className="border shadow-md">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Activity className="h-5 w-5 text-ayush-green" />
            Prakriti (Dosha Constitution) Evaluation
          </CardTitle>
          <Button variant="outline" size="sm" className="flex items-center gap-1">
            <Sparkles className="h-4 w-4 text-amber-500" />
            AI Prakriti Predictor
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-lg bg-blue-50/80 p-4 border border-blue-200">
            <div className="flex justify-between items-center mb-2">
              <span className="font-bold text-blue-800">Vata Dosha</span>
              <span className="text-sm font-semibold text-blue-700">45%</span>
            </div>
            <div className="w-full bg-blue-200 h-2 rounded-full overflow-hidden">
              <div className="bg-blue-600 h-full w-[45%]" />
            </div>
            <p className="text-xs text-blue-600 mt-2">Gati: Chala, Sheeta, Ruksha</p>
          </div>

          <div className="rounded-lg bg-red-50/80 p-4 border border-red-200">
            <div className="flex justify-between items-center mb-2">
              <span className="font-bold text-red-800">Pitta Dosha</span>
              <span className="text-sm font-semibold text-red-700">35%</span>
            </div>
            <div className="w-full bg-red-200 h-2 rounded-full overflow-hidden">
              <div className="bg-red-600 h-full w-[35%]" />
            </div>
            <p className="text-xs text-red-600 mt-2">Gati: Ushna, Tikshna, Drava</p>
          </div>

          <div className="rounded-lg bg-green-50/80 p-4 border border-green-200">
            <div className="flex justify-between items-center mb-2">
              <span className="font-bold text-green-800">Kapha Dosha</span>
              <span className="text-sm font-semibold text-green-700">20%</span>
            </div>
            <div className="w-full bg-green-200 h-2 rounded-full overflow-hidden">
              <div className="bg-green-600 h-full w-[20%]" />
            </div>
            <p className="text-xs text-green-600 mt-2">Gati: Guru, Manda, Snigdha</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
