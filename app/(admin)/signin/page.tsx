import type { Metadata } from 'next'
import { SignInForm } from '@/components/admin/signin-form'

export const metadata: Metadata = {
  title: 'Sign In — Pressload',
}

export default function SignInPage({
  searchParams,
}: {
  searchParams: { callbackUrl?: string; error?: string }
}) {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground">Pressload</h1>
          <p className="text-muted-foreground mt-1">Sign in to your dashboard</p>
        </div>
        <SignInForm
          callbackUrl={searchParams.callbackUrl ?? '/dashboard'}
          error={searchParams.error}
        />
      </div>
    </div>
  )
}
