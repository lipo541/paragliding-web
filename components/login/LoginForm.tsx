'use client'

import Link from 'next/link'
import Image from 'next/image'
import type { ReactNode } from 'react'
import { useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { ArrowRight, Lock, Mail } from 'lucide-react'
import { SiGoogle } from 'react-icons/si'
import type { Locale } from '@/lib/i18n/config'
import { createClient } from '@/lib/supabase/client'
import { useTranslation } from '@/lib/i18n/hooks/useTranslation'

type SocialProvider = {
  id: string
  badge: ReactNode
}

export default function LoginForm() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [checkingAuth, setCheckingAuth] = useState(true)

  // Extract current locale from pathname
  const currentLocale = (pathname.split('/')[1] as Locale) || 'ka'
  const { t } = useTranslation('login')

  const socialProviders: SocialProvider[] = [
    {
      id: 'google',
      badge: <SiGoogle className="h-4 w-4" aria-hidden="true" />,
    },
  ]

  // Check if user is already logged in
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        
        if (session) {
          // User is already logged in, check their role and redirect
          const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', session.user.id)
            .single()
          
          if (profile?.role === 'SUPER_ADMIN') {
            router.push(`/${currentLocale}/cms`)
          } else {
            router.push(`/${currentLocale}`)
          }
        } else {
          // User is not logged in, show the login form
          setCheckingAuth(false)
        }
      } catch (error) {
        console.error('Auth check error:', error)
        setCheckingAuth(false)
      }
    }

    checkAuth()
  }, [supabase, router, currentLocale])

  // Prevent hydration mismatch by not rendering theme-dependent content until mounted
  if (checkingAuth) {
    return (
      <div className="relative isolate flex min-h-[calc(100vh-4rem)] items-center justify-center">
        {/* Completely blank while checking auth - no flash */}
      </div>
    )
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        // Check for invalid credentials error and show translated message
        if (error.message === 'Invalid login credentials') {
          throw new Error(t('errors.invalidCredentials'))
        }
        throw new Error(error.message || t('errors.loginFailed'))
      }

      // Check user role from profiles table
      if (data.user) {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', data.user.id)
          .single()
        
        if (profileError) {
          console.error('Profile query error:', profileError)
          router.push(`/${currentLocale}`)
          return
        }
        
        if (profile?.role === 'SUPER_ADMIN') {
          router.push(`/${currentLocale}/cms`)
        } else {
          router.push(`/${currentLocale}`)
        }
      }
    } catch (err) {
      setError((err as Error).message || t('errors.loginFailed'))
    } finally {
      setLoading(false)
    }
  }

  const handleSocialLogin = async (provider: 'google') => {
    try {
      setLoading(true)
      setError(null)

      const { error } = await supabase.auth.signInWithOAuth({
        provider: provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            prompt: 'select_account',
          },
        },
      })

      if (error) {
        throw new Error(error.message || t('errors.authFailed'))
      }
    } catch (err) {
      setError((err as Error).message || t('errors.authFailed'))
      setLoading(false)
    }
  }

  return (
    <div className="relative isolate flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-4">
        <div className="flex justify-center">
          <Link 
            href={`/${currentLocale}`} 
            className="hover:opacity-80 transition-opacity"
            aria-label="XParagliding - მთავარი გვერდი"
          >
            <div className="px-4 py-2 border-2 border-[#4697D2] dark:border-white/30 rounded-lg backdrop-blur-md bg-[rgba(70,151,210,0.1)] dark:bg-white/5">
              <Image
                src="/vercel.svg"
                alt="XParagliding Logo"
                width={32}
                height={8}
                className="invert dark:invert-0"
                priority
              />
            </div>
            <span className="sr-only">XParagliding - პარაგლაიდინგის დაჯავშნა</span>
          </Link>
        </div>

        <div className="rounded-xl backdrop-blur-md bg-[rgba(70,151,210,0.15)] dark:bg-black/40 border border-[#4697D2]/30 dark:border-white/10 shadow-xl p-8 sm:p-10 transition-all duration-300">
          <div className="space-y-2 text-center">
            <h1 className="text-[30px] font-semibold text-[#1a1a1a] dark:text-white transition-all duration-300">
              {t('title')}
            </h1>
          </div>

          {error && (
            <div className="mt-6 rounded-lg border border-red-500/30 bg-red-500/10 backdrop-blur-sm px-4 py-3 text-sm text-red-600 dark:text-red-400">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="mt-8 space-y-5" noValidate>
            <div className="space-y-2">
              <label htmlFor="email" className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#1a1a1a]/60 dark:text-white/60">
                <Mail className="h-4 w-4" aria-hidden="true" /> {t('email.label')}
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder={t('email.placeholder')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                className="w-full rounded-lg border border-[#4697D2]/30 dark:border-white/20 bg-white/80 dark:bg-black/40 backdrop-blur-sm px-4 py-3 text-sm font-medium text-[#1a1a1a] dark:text-white placeholder:text-[#1a1a1a]/40 dark:placeholder:text-white/40 transition-all duration-300 focus:outline-none focus:border-[#4697D2] focus:ring-2 focus:ring-[#4697D2]/30 dark:focus:border-white/50 dark:focus:ring-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#1a1a1a]/60 dark:text-white/60">
                <Lock className="h-4 w-4" aria-hidden="true" /> {t('password.label')}
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                placeholder={t('password.placeholder')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                className="w-full rounded-lg border border-[#4697D2]/30 dark:border-white/20 bg-white/80 dark:bg-black/40 backdrop-blur-sm px-4 py-3 text-sm font-medium text-[#1a1a1a] dark:text-white placeholder:text-[#1a1a1a]/40 dark:placeholder:text-white/40 transition-all duration-300 focus:outline-none focus:border-[#4697D2] focus:ring-2 focus:ring-[#4697D2]/30 dark:focus:border-white/50 dark:focus:ring-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="group flex w-full items-center justify-center gap-2 rounded-lg border border-[#1a1a1a] dark:border-white bg-[#1a1a1a] dark:bg-white text-white dark:text-[#1a1a1a] px-5 py-3 text-sm font-semibold transition-all duration-300 hover:scale-[1.02] hover:bg-transparent hover:text-[#1a1a1a] dark:hover:bg-transparent dark:hover:text-white active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-[#4697D2]/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {loading ? t('loading') : t('submit')}
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true" />
            </button>

            <div className="mt-5 flex items-center justify-between text-xs text-[#1a1a1a]/50 dark:text-white/50">
              <Link href={`/${currentLocale}/forgot-password`} className="transition-colors duration-300 hover:text-[#4697D2] dark:hover:text-white">
                {t('forgotPassword')}
              </Link>
              <Link href={`/${currentLocale}/register`} className="font-semibold transition-colors duration-300 hover:text-[#4697D2] dark:hover:text-white">
                {t('register')}
              </Link>
            </div>
          </form>

          <div className="mt-8 space-y-4">
            <div className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.3em] text-[#1a1a1a]/50 dark:text-white/50">
              <span className="h-px flex-1 bg-[#4697D2]/30 dark:bg-white/10" />
              {t('divider')}
              <span className="h-px flex-1 bg-[#4697D2]/30 dark:bg-white/10" />
            </div>

            <div className="space-y-2.5">
              {socialProviders.map((provider) => (
                <button
                  key={provider.id}
                  type="button"
                  onClick={() => handleSocialLogin(provider.id as 'google')}
                  disabled={loading}
                  className="group flex w-full items-center justify-between rounded-lg border border-[#4697D2]/30 dark:border-white/20 bg-white/80 dark:bg-black/40 backdrop-blur-sm text-[#1a1a1a] dark:text-white px-4 py-3 text-left text-sm font-medium transition-all duration-300 hover:-translate-y-0.5 hover:bg-black hover:text-white hover:border-white dark:hover:bg-black dark:hover:border-white focus:outline-none focus:ring-2 focus:ring-[#4697D2]/30 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                >
                  <span className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full border border-[#4697D2]/30 dark:border-white/20 bg-white/50 dark:bg-white/10 text-[#1a1a1a] dark:text-white text-base transition-all duration-300 group-hover:border-white group-hover:bg-transparent group-hover:text-white">
                      {provider.badge}
                    </span>
                    <span className="text-sm font-semibold">
                      {t('social.google')}
                    </span>
                  </span>
                  <ArrowRight className="h-4 w-4 text-[#1a1a1a]/40 dark:text-white/40 transition-transform duration-300 group-hover:translate-x-1 group-hover:text-white" aria-hidden="true" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
