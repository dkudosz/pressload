import Link from 'next/link'
import { siteConfig } from '@/lib/site-config'

export default function HomePage() {
  return (
    <section>
      <p className="text-sm text-primary mb-2">App Router starter</p>
      <h1 className="text-4xl font-bold text-foreground mt-0">{siteConfig.name}</h1>
      <p className="text-muted-foreground max-w-2xl leading-relaxed mt-4">
        {siteConfig.description} This initial structure uses Next.js App Router and gives you a
        clear place for routes, reusable UI components, and shared application utilities.
      </p>
      <div className="flex gap-4 mt-6">
        <Link href="/blog" className="text-primary hover:underline underline-offset-4 transition-colors">
          Go to blog route
        </Link>
        <Link href="/about" className="text-muted-foreground hover:text-foreground transition-colors">
          Read about this project
        </Link>
      </div>
    </section>
  )
}
