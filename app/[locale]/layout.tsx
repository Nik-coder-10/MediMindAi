import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Providers } from "@/components/shared/Providers";
import { Navbar } from "@/components/shared/Navbar";
import "@/app/globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
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
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Noto+Sans+Devanagari:wght@400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className={`${inter.variable} font-sans`}>
        <Providers>
          <div className="relative flex min-h-screen flex-col">
            <Navbar locale={locale || "en"} />
            <main className="flex-1">{children}</main>

            {/* Premium Footer */}
            <footer className="glass-panel border-t border-white/40 dark:border-white/06 py-5">
              <div className="container flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
                <div className="text-[11px] text-muted-foreground font-medium">
                  Ministry of Ayush / All India Institute of Ayurveda (AIIA) · SIH 2026 Problem ID 26047
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
