'use client';

import { useEffect } from "react";
import Header from "@/components/header/Header";
import Footer from "@/components/footer/Footer";
import UserBottomNav from "@/components/userbottomnav/UserBottomNav";
import CompanyBottomNav from "@/components/companybottomnav/CompanyBottomNav";
import PilotBottomNav from "@/components/pilotbottomnav/PilotBottomNav";
import { ThemeProvider } from "@/components/themechanger/ThemeProvider";
import { createClient } from "@/lib/supabase/client";

interface LocaleLayoutClientProps {
  children: React.ReactNode;
  locale: string;
}

export default function LocaleLayoutClient({ children, locale }: LocaleLayoutClientProps) {
  const supabase = createClient();

  // Auth check in background - არ ბლოკავს რენდერინგს
  // ეს საჭიროა Supabase session-ის ინიციალიზაციისთვის
  useEffect(() => {
    supabase.auth.getSession();
  }, [supabase.auth]);

  // ✅ children პირდაპირ რენდერდება - არა loading spinner
  // ეს უზრუნველყოფს რომ კონტენტი ჩანს Google-ისთვის
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <Header />
      <div className="pb-20">
        {children}
      </div>
      <Footer />
      <UserBottomNav />
      <CompanyBottomNav />
      <PilotBottomNav />
    </ThemeProvider>
  );
}
