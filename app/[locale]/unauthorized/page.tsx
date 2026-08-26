import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { ShieldAlert } from "lucide-react";

export default function UnauthorizedPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  return (
    <div className="container max-w-md py-20">
      <Card className="text-center border-destructive/30 shadow-lg">
        <CardHeader className="space-y-2">
          <div className="mx-auto w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
            <ShieldAlert className="h-6 w-6 text-destructive" />
          </div>
          <CardTitle className="text-xl">Access Restricted / अनधिकृत पहुंच</CardTitle>
          <CardDescription>
            You do not have the required clinical role or permissions to access this area.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-2">
          <Button variant="default" asChild className="w-full">
            <Link href={`/${locale}/login`}>Return to Login</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
