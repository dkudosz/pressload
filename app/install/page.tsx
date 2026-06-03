import { redirect } from 'next/navigation'
import { InstallStep1Form } from '@/components/install/step1-form'
import { testDatabaseConnection, checkTablesExist, runMigrations } from './actions'

export default async function InstallPage() {
  const dbUrl = process.env.DATABASE_URL ?? ''

  // If DATABASE_URL is configured, try to auto-advance past the DB steps.
  if (dbUrl) {
    const { success } = await testDatabaseConnection(dbUrl)

    if (success) {
      const { exists } = await checkTablesExist(dbUrl)

      if (exists) {
        // DB connected + tables exist → jump straight to site setup
        redirect('/install/setup')
      } else {
        // DB connected but tables missing → run migrations then go to setup
        const result = await runMigrations()
        if (result.success) {
          redirect('/install/setup')
        }
        // If migrations failed, fall through and show the connection form
        // so the user can diagnose the problem.
      }
    }
    // DB configured but connection failed → fall through to show the form
    // with the URL pre-filled so the user can correct it.
  }

  // Manual path: show the connection string form (step 1 of 4)
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
