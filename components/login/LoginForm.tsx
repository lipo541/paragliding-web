'use client'

import Link from 'next/link'
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
          <Link href={`/${currentLocale}`} className="hover:opacity-80 transition-opacity">
            <div className="px-4 py-2 border-2 border-foreground rounded-md">
              <span className="text-xl font-bold text-foreground tracking-tight">caucasus</span>
            </div>
          </Link>
        </div>

        <div className="rounded-3xl border border-foreground/10 bg-background p-8 transition-all duration-300 sm:p-10">
          <div className="space-y-2 text-center">
            <h1 className="text-[30px] font-semibold text-foreground transition-all duration-300">
              {t('title')}
            </h1>
          </div>

          {error && (
            <div className="mt-6 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="mt-8 space-y-5" noValidate>
            <div className="space-y-2">
              <label htmlFor="email" className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-foreground/60">
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
                className="w-full rounded-2xl border border-foreground/10 bg-background px-4 py-3 text-sm font-medium text-foreground placeholder:text-foreground/40 transition-all duration-300 focus:outline-none focus:border-foreground focus:ring-1 focus:ring-foreground disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-foreground/60">
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
                className="w-full rounded-2xl border border-foreground/10 bg-background px-4 py-3 text-sm font-medium text-foreground placeholder:text-foreground/40 transition-all duration-300 focus:outline-none focus:border-foreground focus:ring-1 focus:ring-foreground disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="group flex w-full items-center justify-center gap-2 rounded-2xl border border-foreground bg-foreground text-background px-5 py-3 text-sm font-semibold transition-all duration-300 hover:scale-[1.02] hover:bg-background hover:text-foreground active:scale-[0.98] focus:outline-none focus:ring-1 focus:ring-foreground disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {loading ? t('loading') : t('submit')}
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true" />
            </button>

            <div className="mt-5 flex items-center justify-between text-xs text-foreground/50">
              <Link href={`/${currentLocale}/forgot-password`} className="transition-colors duration-300 hover:text-foreground">
                {t('forgotPassword')}
              </Link>
              <Link href={`/${currentLocale}/register`} className="font-semibold transition-colors duration-300 hover:text-foreground">
                {t('register')}
              </Link>
            </div>
          </form>

          <div className="mt-8 space-y-4">
            <div className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.3em] text-foreground/50">
              <span className="h-px flex-1 bg-foreground/10" />
              {t('divider')}
              <span className="h-px flex-1 bg-foreground/10" />
            </div>

            <div className="space-y-2.5">
              {socialProviders.map((provider) => (
                <button
                  key={provider.id}
                  type="button"
                  onClick={() => handleSocialLogin(provider.id as 'google')}
                  disabled={loading}
                  className="group flex w-full items-center justify-between rounded-2xl border border-foreground/10 bg-background text-foreground px-4 py-3 text-left text-sm font-medium transition-all duration-300 hover:-translate-y-0.5 hover:border-foreground hover:bg-foreground hover:text-background focus:outline-none focus:ring-1 focus:ring-foreground disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                >
                  <span className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full border border-foreground/10 bg-background text-foreground text-base transition-all duration-300 group-hover:border-background group-hover:bg-foreground group-hover:text-background">
                      {provider.badge}
                    </span>
                    <span className="text-sm font-semibold">
                      {t('social.google')}
                    </span>
                  </span>
                  <ArrowRight className="h-4 w-4 text-foreground/40 transition-transform duration-300 group-hover:translate-x-1 group-hover:text-background" aria-hidden="true" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
