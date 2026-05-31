import { InstallStep3Form } from '@/components/install/step3-form'

export default function InstallSetupPage() {
  const siteUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        {[1, 2, 3, 4].map((n) => (
          <div key={n} className="flex items-center gap-2">
            <div
              className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                n < 3
                  ? 'bg-primary/30 text-primary'
                  : n === 3
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-muted-foreground'
              }`}
            >
              {n < 3 ? '✓' : n}
            </div>
            {n < 4 && <div className="h-px w-6 bg-border" />}
          </div>
        ))}
        <p className="text-sm text-muted-foreground ml-2">Site Information</p>
      </div>

      <InstallStep3Form defaultSiteUrl={siteUrl} />
    </div>
  )
}
