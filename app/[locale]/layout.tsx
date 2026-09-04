import type { Metadata } from "next";
import { Inter, Noto_Sans_Devanagari } from "next/font/google";
import { Providers } from "@/components/shared/Providers";
import { Navbar } from "@/components/shared/Navbar";
import { AyurSetuLogo } from "@/components/shared/AyurSetuLogo";
import { LivingForestBackground } from "@/components/landing/LivingForestBackground";
import "@/app/globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});

const notoSansDevanagari = Noto_Sans_Devanagari({
  subsets: ["devanagari"],
  variable: "--font-noto-sans-devanagari",
  display: "swap",
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "AyurSetu — Next-Gen Ayush Clinical Platform | Ministry of Ayush",
  description:
    "AI-powered Ayush clinical case-taking, Dashavidha Pariksha, Prakriti evaluation, multilingual voice triage, and ABDM interoperable PHR. SIH 2026 · Problem ID 26047.",
  keywords: "Ayurveda, ABDM, ABHA, clinical case-taking, Prakriti, Ministry of Ayush, AIIA, SIH 2026",
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
      <body className={`${inter.variable} ${notoSansDevanagari.variable} font-sans`}>
        <Providers>
          <div className="relative flex min-h-screen flex-col bg-background selection:bg-emerald-500/20">
            {/* ─── Global Living Ayurvedic Forest Multi-Layer Atmosphere (All Subpages) ─── */}
            <LivingForestBackground isFixed />

            <Navbar locale={locale || "en"} />
            <main className="relative z-10 flex-1">{children}</main>

            {/* Premium Footer */}
            <footer className="glass-panel border-t border-white/40 dark:border-white/06 py-5">
              <div className="container flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
                <div className="flex items-center gap-3">
                  <AyurSetuLogo size="sm" />
                  <div className="text-[11px] text-muted-foreground font-medium leading-tight">
                    <span className="font-bold text-foreground">AyurSetu</span> · A MediMindAI Project
                    <div className="text-[10px] text-muted-foreground/80">Ministry of Ayush / AIIA Digital Initiative</div>
                  </div>
                </div>
                <div className="text-[10px] text-muted-foreground font-semibold">
                  WCAG 2.2 AA Compliant · ABDM &amp; Ayush FHIR Ready · DPDP Secured
                </div>
              </div>
            </footer>
          </div>
        </Providers>
      </body>
    </html>
  );
}
