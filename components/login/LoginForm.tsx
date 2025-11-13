'use client'

import Link from 'next/link'
import Image from 'next/image'
import type { ReactNode } from 'react'
import { useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { ArrowRight, Lock, Mail } from 'lucide-react'
import { SiGoogle } from 'react-icons/si'
import { useTheme } from 'next-themes'
import type { Locale } from '@/lib/i18n/config'
import { createClient } from '@/lib/supabase/client'

type SocialProvider = {
  id: string
  label: string
  badge: ReactNode
}

const socialProviders: SocialProvider[] = [
  {
    id: 'google',
    label: 'Google-ით შესვლა',
    badge: <SiGoogle className="h-4 w-4" aria-hidden="true" />,
  },
]

export default function LoginForm() {
  const [mounted, setMounted] = useState(false)
  const { theme } = useTheme()
  const pathname = usePathname()
  const router = useRouter()
  const isDark = theme === 'dark'
  const supabase = createClient()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [checkingAuth, setCheckingAuth] = useState(true)

  // Extract current locale from pathname
  const currentLocale = (pathname.split('/')[1] as Locale) || 'ka'

  useEffect(() => {
    setMounted(true)
  }, [])

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
  if (!mounted || checkingAuth) {
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

      if (error) throw error

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
      setError((err as Error).message || 'შესვლა ვერ მოხერხდა')
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

      if (error) throw error
    } catch (err) {
      setError((err as Error).message || 'ავტორიზაცია ვერ მოხერხდა')
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

        <div className={`rounded-3xl border p-8 transition-all duration-300 sm:p-10 ${isDark ? 'border-white/10 bg-black' : 'border-black/10 bg-white'}`}>
          <div className="space-y-2 text-center">
            <h1 className={`text-[30px] font-semibold transition-all duration-300 ${isDark ? 'text-white' : 'text-black'}`}>
              შესვლა
            </h1>
          </div>

          {error && (
            <div className={`mt-6 rounded-xl border px-4 py-3 text-sm ${isDark ? 'border-red-500/20 bg-red-500/10 text-red-400' : 'border-red-500/20 bg-red-50 text-red-600'}`}>
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="mt-8 space-y-5" noValidate>
            <div className="space-y-2">
              <label htmlFor="email" className={`flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                <Mail className="h-4 w-4" aria-hidden="true" /> ელფოსტა
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                className={`w-full rounded-2xl border px-4 py-3 text-sm font-medium transition-all duration-300 focus:outline-none focus:ring-1 disabled:opacity-50 disabled:cursor-not-allowed ${isDark ? 'border-white/10 bg-black text-white placeholder:text-white/40 focus:border-white focus:ring-white' : 'border-black/10 bg-white text-black placeholder:text-black/40 focus:border-black focus:ring-black'}`}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className={`flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                <Lock className="h-4 w-4" aria-hidden="true" /> პაროლი
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                className={`w-full rounded-2xl border px-4 py-3 text-sm font-medium transition-all duration-300 focus:outline-none focus:ring-1 disabled:opacity-50 disabled:cursor-not-allowed ${isDark ? 'border-white/10 bg-black text-white placeholder:text-white/40 focus:border-white focus:ring-white' : 'border-black/10 bg-white text-black placeholder:text-black/40 focus:border-black focus:ring-black'}`}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`group flex w-full items-center justify-center gap-2 rounded-2xl border px-5 py-3 text-sm font-semibold transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] focus:outline-none focus:ring-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 ${isDark ? 'border-white bg-white text-black hover:bg-black hover:text-white focus:ring-white' : 'border-black bg-black text-white hover:bg-white hover:text-black focus:ring-black'}`}
            >
              {loading ? 'იტვირთება...' : 'შესვლა'}
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true" />
            </button>

            <div className={`mt-5 flex items-center justify-between text-xs ${isDark ? 'text-white/50' : 'text-black/50'}`}>
              <Link href={`/${currentLocale}/forgot-password`} className={`transition-colors duration-300 ${isDark ? 'hover:text-white' : 'hover:text-black'}`}>
                დაგავიწყდა პაროლი?
              </Link>
              <Link href={`/${currentLocale}/register`} className={`font-semibold transition-colors duration-300 ${isDark ? 'hover:text-white' : 'hover:text-black'}`}>
                რეგისტრაცია
              </Link>
            </div>
          </form>

          <div className="mt-8 space-y-4">
            <div className={`flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.3em] ${isDark ? 'text-white/50' : 'text-black/50'}`}>
              <span className={`h-px flex-1 ${isDark ? 'bg-white/10' : 'bg-black/10'}`} />
              ან
              <span className={`h-px flex-1 ${isDark ? 'bg-white/10' : 'bg-black/10'}`} />
            </div>

            <div className="space-y-2.5">
              {socialProviders.map((provider) => (
                <button
                  key={provider.id}
                  type="button"
                  onClick={() => handleSocialLogin(provider.id as 'google')}
                  disabled={loading}
                  className={`group flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left text-sm font-medium transition-all duration-300 hover:-translate-y-0.5 focus:outline-none focus:ring-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 ${isDark ? 'border-white/10 bg-black text-white hover:border-white hover:bg-white hover:text-black focus:ring-white' : 'border-black/10 bg-white text-black hover:border-black hover:bg-black hover:text-white focus:ring-black'}`}
                >
                  <span className="flex items-center gap-3">
                    <span className={`flex h-9 w-9 items-center justify-center rounded-full border text-base transition-all duration-300 ${isDark ? 'border-white/10 bg-black text-white group-hover:border-black group-hover:bg-white group-hover:text-black' : 'border-black/10 bg-white text-black group-hover:border-white group-hover:bg-black group-hover:text-white'}`}>
                      {provider.badge}
                    </span>
                    <span className="text-sm font-semibold">
                      {provider.label}
                    </span>
                  </span>
                  <ArrowRight className={`h-4 w-4 transition-transform duration-300 group-hover:translate-x-1 ${isDark ? 'text-white/40 group-hover:text-black' : 'text-black/40 group-hover:text-white'}`} aria-hidden="true" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
