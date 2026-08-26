import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Providers } from "@/components/shared/Providers";
import { Navbar } from "@/components/shared/Navbar";
import "@/app/globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AyurSetu - Patient Case-Taking Software | Ministry of Ayush",
  description: "Next-generation Ayush clinical case-taking, Prakriti evaluation, and ABDM interoperable health system.",
};

export default function RootLayout({
  children,
  params: { locale },
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  return (
    <html lang={locale || "en"} suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>
          <div className="relative flex min-h-screen flex-col">
            <Navbar locale={locale || "en"} />
            <main className="flex-1">{children}</main>
            <footer className="border-t py-6 text-center text-sm text-muted-foreground bg-muted/30">
              <div className="container">
                <p>Ministry of Ayush / All India Institute of Ayurveda (AIIA) • SIH 2026 Problem ID 26047</p>
                <p className="text-xs mt-1">WCAG 2.2 AA Compliant • ABDM & Ayush FHIR Ready</p>
              </div>
            </footer>
          </div>
        </Providers>
      </body>
    </html>
  );
}
