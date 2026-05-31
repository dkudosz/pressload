import type { Metadata } from 'next'
import { Separator } from '@/components/ui/separator'

export const metadata: Metadata = {
  title: 'Install Pressload',
}

export default function InstallLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground">Pressload</h1>
          <p className="text-muted-foreground mt-1">Installation Wizard</p>
        </div>
        {children}
      </div>
    </div>
  )
}
