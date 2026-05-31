import { SiteHeader } from '@/components/site-header'

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1 max-w-4xl mx-auto w-full px-6 py-8">{children}</main>
    </div>
  )
}
