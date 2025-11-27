import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/themechanger/ThemeProvider";
import { SupabaseProvider } from "@/lib/supabase/SupabaseProvider";
import ToastProvider from "@/components/ui/Toast";
import GlobalBackground from "@/components/background/GlobalBackground";
import { BASE_URL, SITE_NAME, DEFAULT_DESCRIPTIONS } from "@/lib/seo";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: SITE_NAME,
  description: DEFAULT_DESCRIPTIONS.en,
  metadataBase: new URL(BASE_URL),
};

interface RootLayoutProps {
  children: React.ReactNode;
  params?: Promise<{ locale?: string }>;
}

export default async function RootLayout({
  children,
  params,
}: RootLayoutProps) {
  // locale-ის დინამიური წამოღება URL-დან
  // თუ params არ არის ან locale არ არის, default 'ka'
  const resolvedParams = params ? await params : {};
  const locale = resolvedParams.locale || 'ka';
  
  return (
    <html lang={locale} suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <SupabaseProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <GlobalBackground />
            <ToastProvider />
            {children}
          </ThemeProvider>
        </SupabaseProvider>
      </body>
    </html>
  );
}
