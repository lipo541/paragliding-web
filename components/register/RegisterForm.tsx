'use client'

import Link from 'next/link'
import type { ReactNode } from 'react'
import { useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { ArrowRight, Lock, Mail, User, Eye, EyeOff } from 'lucide-react'
import { SiGoogle } from 'react-icons/si'
import type { Locale } from '@/lib/i18n/config'
import { createClient } from '@/lib/supabase/client'
import { useTranslation } from '@/lib/i18n/hooks/useTranslation'

type SocialProvider = {
  id: string
  badge: ReactNode
}

export default function RegisterForm() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [checkingAuth, setCheckingAuth] = useState(true)

  // Extract current locale from pathname
  const currentLocale = (pathname.split('/')[1] as Locale) || 'ka'
  const { t } = useTranslation('register')

  const socialProviders: SocialProvider[] = [
    {
      id: 'google',
      badge: <SiGoogle className="h-5 w-5" aria-hidden="true" />,
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
          // User is not logged in, show the register form
          setCheckingAuth(false)
        }
      } catch (error) {
        console.error('Auth check error:', error)
        setCheckingAuth(false)
      }
    }

    checkAuth()
  }, [supabase, router, currentLocale])

  // Prevent hydration mismatch
  if (checkingAuth) {
    return (
      <div className="relative isolate flex min-h-[calc(100vh-4rem)] items-center justify-center">
        {/* Completely blank while checking auth - no flash */}
      </div>
    )
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    // Validation
    if (!fullName || !email || !password || !confirmPassword) {
      setError(t('errors.allFields'))
      setLoading(false)
      return
    }

    if (password !== confirmPassword) {
      setError(t('errors.passwordMismatch'))
      setLoading(false)
      return
    }

    if (password.length < 6) {
      setError(t('errors.passwordLength'))
      setLoading(false)
      return
    }

    try {
      // Register user with Supabase Auth
      // Profile will be created automatically by the database trigger
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      })

      if (signUpError) throw signUpError

      if (data.user) {
        // Redirect to login page
        router.push(`/${currentLocale}/login?registered=true`)
      }
    } catch (err) {
      setError((err as Error).message || t('errors.registerFailed'))
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

          {/* Google Button at Top */}
          <div className="mt-8">
            <button
              type="button"
              onClick={() => handleSocialLogin('google')}
              disabled={loading}
              className="group flex w-full items-center justify-center gap-3 rounded-xl border border-foreground/20 bg-transparent text-foreground px-4 py-3 text-sm font-medium transition-all duration-300 hover:scale-[1.02] hover:bg-foreground hover:text-background active:scale-[0.98] focus:outline-none focus:ring-1 focus:ring-foreground disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              <SiGoogle className="h-5 w-5" aria-hidden="true" />
              {t('social.google')}
            </button>
          </div>

          <div className="mt-6 space-y-4">
            <div className="flex items-center gap-3 text-[11px] font-medium uppercase tracking-[0.2em] text-foreground/50">
              <span className="h-px flex-1 bg-foreground/10" />
              {t('divider')}
              <span className="h-px flex-1 bg-foreground/10" />
            </div>
          </div>

          <form onSubmit={handleRegister} className="mt-6 space-y-4" noValidate>
            {/* Full Name */}
            <div className="space-y-2">
              <label htmlFor="fullname" className="block text-sm font-medium text-foreground">
                {t('fullName.label')}
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-foreground/40" aria-hidden="true" />
                <input
                  id="fullname"
                  name="fullname"
                  type="text"
                  autoComplete="name"
                  placeholder={t('fullName.placeholder')}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  disabled={loading}
                  required
                  className="w-full rounded-xl border border-foreground/10 bg-background text-foreground placeholder:text-foreground/40 px-12 py-3 text-sm font-medium transition-all duration-300 focus:outline-none focus:border-foreground/30 focus:ring-2 focus:ring-foreground/20 disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            {/* Email Address */}
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium text-foreground">
                {t('email.label')}
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-foreground/40" aria-hidden="true" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder={t('email.placeholder')}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  required
                  className="w-full rounded-xl border border-foreground/10 bg-background text-foreground placeholder:text-foreground/40 px-12 py-3 text-sm font-medium transition-all duration-300 focus:outline-none focus:border-foreground/30 focus:ring-2 focus:ring-foreground/20 disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-medium text-foreground">
                {t('password.label')}
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-foreground/40" aria-hidden="true" />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder={t('password.placeholder')}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  required
                  className="w-full rounded-xl border border-foreground/10 bg-background text-foreground placeholder:text-foreground/40 px-12 py-3 text-sm font-medium transition-all duration-300 focus:outline-none focus:border-foreground/30 focus:ring-2 focus:ring-foreground/20 disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-foreground/40 hover:text-foreground/60 transition-colors duration-300 disabled:opacity-50"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-foreground">
                {t('confirmPassword.label')}
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-foreground/40" aria-hidden="true" />
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder={t('confirmPassword.placeholder')}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={loading}
                  required
                  className="w-full rounded-xl border border-foreground/10 bg-background text-foreground placeholder:text-foreground/40 px-12 py-3 text-sm font-medium transition-all duration-300 focus:outline-none focus:border-foreground/30 focus:ring-2 focus:ring-foreground/20 disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  disabled={loading}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-foreground/40 hover:text-foreground/60 transition-colors duration-300 disabled:opacity-50"
                >
                  {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {/* Create Account Button */}
            <button
              type="submit"
              disabled={loading}
              className="group flex w-full items-center justify-center gap-2 rounded-xl border border-foreground bg-foreground text-background px-5 py-3 text-sm font-semibold transition-all duration-300 hover:scale-[1.02] hover:bg-background hover:text-foreground active:scale-[0.98] focus:outline-none focus:ring-1 focus:ring-foreground mt-6 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {loading ? t('loading') : t('submit')}
            </button>
          </form>

          {/* Already have account */}
          <div className="mt-5 text-center text-sm text-foreground/50">
            {t('haveAccount')}{' '}
            <Link href={`/${currentLocale}/login`} className="font-semibold text-foreground hover:text-foreground/80 transition-colors duration-300">
              {t('signIn')}
            </Link>
          </div>

          {/* Terms and Privacy */}
          <div className="mt-6 text-center text-xs text-foreground/40">
            {t('agreement')}{' '}
            <Link href={`/${currentLocale}/terms`} className="font-medium text-foreground/60 hover:text-foreground transition-colors duration-300">
              {t('terms')}
            </Link>{' '}
            {t('and')}{' '}
            <Link href={`/${currentLocale}/privacy`} className="font-medium text-foreground/60 hover:text-foreground transition-colors duration-300">
              {t('privacy')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
