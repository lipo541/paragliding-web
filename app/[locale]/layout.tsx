'use client';

import { useEffect, useState } from "react";
import Header from "@/components/header/Header";
import Footer from "@/components/footer/Footer";
import UserBottomNav from "@/components/userbottomnav/UserBottomNav";
import { ThemeProvider } from "@/components/themechanger/ThemeProvider";
import { createClient } from "@/lib/supabase/client";

export default function LocaleLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const checkAuth = async () => {
      await supabase.auth.getSession();
      setIsLoading(false);
    };
    
    checkAuth();
  }, [supabase.auth]);

  if (isLoading) {
    return (
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <div className="flex min-h-screen items-center justify-center bg-background">
          <div className="flex flex-col items-center gap-4">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-foreground/20 border-t-foreground"></div>
            <p className="text-sm text-foreground/60">იტვირთება...</p>
          </div>
        </div>
      </ThemeProvider>
    );
  }

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
    </ThemeProvider>
  );
}
