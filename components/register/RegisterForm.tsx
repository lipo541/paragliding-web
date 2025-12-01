'use client'

import Link from 'next/link'
import Image from 'next/image'
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

      if (signUpError) {
        // Check for user already registered error and show translated message
        if (signUpError.message === 'User already registered') {
          throw new Error(t('errors.userAlreadyRegistered'))
        }
        throw signUpError
      }

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

          {/* Google Button at Top */}
          <div className="mt-8">
            <button
              type="button"
              onClick={() => handleSocialLogin('google')}
              disabled={loading}
              className="group flex w-full items-center justify-center gap-3 rounded-lg border border-[#4697D2]/30 dark:border-white/20 bg-white/80 dark:bg-black/40 backdrop-blur-sm text-[#1a1a1a] dark:text-white px-4 py-3 text-sm font-medium transition-all duration-300 hover:scale-[1.02] hover:bg-black hover:text-white hover:border-white dark:hover:bg-black dark:hover:border-white active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-[#4697D2]/30 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              <SiGoogle className="h-5 w-5" aria-hidden="true" />
              {t('social.google')}
            </button>
          </div>

          <div className="mt-6 space-y-4">
            <div className="flex items-center gap-3 text-[11px] font-medium uppercase tracking-[0.2em] text-[#1a1a1a]/50 dark:text-white/50">
              <span className="h-px flex-1 bg-[#4697D2]/30 dark:bg-white/10" />
              {t('divider')}
              <span className="h-px flex-1 bg-[#4697D2]/30 dark:bg-white/10" />
            </div>
          </div>

          <form onSubmit={handleRegister} className="mt-6 space-y-4" noValidate>
            {/* Full Name */}
            <div className="space-y-2">
              <label htmlFor="fullname" className="block text-sm font-medium text-[#1a1a1a] dark:text-white">
                {t('fullName.label')}
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#1a1a1a]/40 dark:text-white/40" aria-hidden="true" />
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
                  className="w-full rounded-lg border border-[#4697D2]/30 dark:border-white/20 bg-white/80 dark:bg-black/40 backdrop-blur-sm text-[#1a1a1a] dark:text-white placeholder:text-[#1a1a1a]/40 dark:placeholder:text-white/40 px-12 py-3 text-sm font-medium transition-all duration-300 focus:outline-none focus:border-[#4697D2] focus:ring-2 focus:ring-[#4697D2]/30 dark:focus:border-white/50 dark:focus:ring-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            {/* Email Address */}
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium text-[#1a1a1a] dark:text-white">
                {t('email.label')}
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#1a1a1a]/40 dark:text-white/40" aria-hidden="true" />
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
                  className="w-full rounded-lg border border-[#4697D2]/30 dark:border-white/20 bg-white/80 dark:bg-black/40 backdrop-blur-sm text-[#1a1a1a] dark:text-white placeholder:text-[#1a1a1a]/40 dark:placeholder:text-white/40 px-12 py-3 text-sm font-medium transition-all duration-300 focus:outline-none focus:border-[#4697D2] focus:ring-2 focus:ring-[#4697D2]/30 dark:focus:border-white/50 dark:focus:ring-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-medium text-[#1a1a1a] dark:text-white">
                {t('password.label')}
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#1a1a1a]/40 dark:text-white/40" aria-hidden="true" />
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
                  className="w-full rounded-lg border border-[#4697D2]/30 dark:border-white/20 bg-white/80 dark:bg-black/40 backdrop-blur-sm text-[#1a1a1a] dark:text-white placeholder:text-[#1a1a1a]/40 dark:placeholder:text-white/40 px-12 py-3 text-sm font-medium transition-all duration-300 focus:outline-none focus:border-[#4697D2] focus:ring-2 focus:ring-[#4697D2]/30 dark:focus:border-white/50 dark:focus:ring-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#1a1a1a]/40 dark:text-white/40 hover:text-[#1a1a1a]/60 dark:hover:text-white/60 transition-colors duration-300 disabled:opacity-50"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-[#1a1a1a] dark:text-white">
                {t('confirmPassword.label')}
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#1a1a1a]/40 dark:text-white/40" aria-hidden="true" />
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
                  className="w-full rounded-lg border border-[#4697D2]/30 dark:border-white/20 bg-white/80 dark:bg-black/40 backdrop-blur-sm text-[#1a1a1a] dark:text-white placeholder:text-[#1a1a1a]/40 dark:placeholder:text-white/40 px-12 py-3 text-sm font-medium transition-all duration-300 focus:outline-none focus:border-[#4697D2] focus:ring-2 focus:ring-[#4697D2]/30 dark:focus:border-white/50 dark:focus:ring-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  disabled={loading}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#1a1a1a]/40 dark:text-white/40 hover:text-[#1a1a1a]/60 dark:hover:text-white/60 transition-colors duration-300 disabled:opacity-50"
                >
                  {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {/* Create Account Button */}
            <button
              type="submit"
              disabled={loading}
              className="group flex w-full items-center justify-center gap-2 rounded-lg border border-[#1a1a1a] dark:border-white bg-[#1a1a1a] dark:bg-white text-white dark:text-[#1a1a1a] px-5 py-3 text-sm font-semibold transition-all duration-300 hover:scale-[1.02] hover:bg-transparent hover:text-[#1a1a1a] dark:hover:bg-transparent dark:hover:text-white active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-[#4697D2]/50 mt-6 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {loading ? t('loading') : t('submit')}
            </button>
          </form>

          {/* Already have account */}
          <div className="mt-5 text-center text-sm text-[#1a1a1a]/50 dark:text-white/50">
            {t('haveAccount')}{' '}
            <Link href={`/${currentLocale}/login`} className="font-semibold text-[#1a1a1a] dark:text-white hover:text-[#4697D2] dark:hover:text-white/80 transition-colors duration-300">
              {t('signIn')}
            </Link>
          </div>

          {/* Terms and Privacy */}
          <div className="mt-6 text-center text-xs text-[#1a1a1a]/40 dark:text-white/40">
            {t('agreement')}{' '}
            <Link href={`/${currentLocale}/terms`} className="font-medium text-[#1a1a1a]/60 dark:text-white/60 hover:text-[#4697D2] dark:hover:text-white transition-colors duration-300">
              {t('terms')}
            </Link>{' '}
            {t('and')}{' '}
            <Link href={`/${currentLocale}/privacy`} className="font-medium text-[#1a1a1a]/60 dark:text-white/60 hover:text-[#4697D2] dark:hover:text-white transition-colors duration-300">
              {t('privacy')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
