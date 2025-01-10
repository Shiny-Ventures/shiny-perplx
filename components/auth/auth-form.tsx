'use client';

import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import { supabase } from '@/lib/supabase-client'
import { useState, useEffect } from 'react'
import { useTheme } from 'next-themes'

export function AuthForm() {
  const [redirectUrl, setRedirectUrl] = useState<string>('')
  const { theme } = useTheme()

  useEffect(() => {
    const baseUrl = process.env.NODE_ENV === 'production' 
      ? 'https://shiny-perplx.vercel.app' 
      : process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
    setRedirectUrl(`${baseUrl}/auth/callback`);
  }, [])

  if (!redirectUrl) {
    return null
  }

  return (
    <div className="w-full max-w-md mx-auto p-6">
      <Auth
        supabaseClient={supabase}
        appearance={{ 
          theme: ThemeSupa,
          variables: {
            default: {
              colors: {
                brand: 'rgb(47, 47, 47)',
                brandAccent: 'rgb(0, 0, 0)',
              },
            },
          },
          className: {
            container: 'auth-container',
            button: 'auth-button',
            input: theme === 'dark' ? 'dark-input' : 'light-input',
          },
        }}
        providers={['google', 'discord']}
        redirectTo={redirectUrl}
        theme={theme as 'dark' | 'light'}
      />
    </div>
  )
} 