import { InstallStep1Form } from '@/components/install/step1-form'

export default function InstallPage() {
  const dbUrl = process.env.DATABASE_URL ?? ''

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        {[1, 2, 3, 4].map((n) => (
          <div key={n} className="flex items-center gap-2">
            <div
              className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                n === 1
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-muted-foreground'
              }`}
            >
              {n}
            </div>
            {n < 4 && <div className="h-px w-6 bg-border" />}
          </div>
        ))}
        <p className="text-sm text-muted-foreground ml-2">Database Connection</p>
      </div>

      <InstallStep1Form initialUrl={dbUrl} />
    </div>
  )
}
