import { InstallStep2 } from '@/components/install/step2-migrations'

export default function InstallDatabasePage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        {[1, 2, 3, 4].map((n) => (
          <div key={n} className="flex items-center gap-2">
            <div
              className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                n < 2
                  ? 'bg-primary/30 text-primary'
                  : n === 2
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-muted-foreground'
              }`}
            >
              {n < 2 ? '✓' : n}
            </div>
            {n < 4 && <div className="h-px w-6 bg-border" />}
          </div>
        ))}
        <p className="text-sm text-muted-foreground ml-2">Create Database Tables</p>
      </div>

      <InstallStep2 />
    </div>
  )
}
