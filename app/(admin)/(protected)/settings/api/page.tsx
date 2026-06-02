import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getWebhooks } from '@/lib/api/webhooks'
import { WebhookManager } from '@/components/admin/webhook-manager'

export default async function ApiSettingsPage() {
  const hooks = await getWebhooks()

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-lg font-semibold text-foreground">API & Webhooks</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Manage webhook endpoints that receive events when content changes.
        </p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Webhooks</CardTitle>
        </CardHeader>
        <CardContent>
          <WebhookManager initialHooks={hooks} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Available Events</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm space-y-1 font-mono text-muted-foreground">
            {['post.created', 'post.updated', 'post.deleted', '*  (all events)'].map((ev) => (
              <div key={ev} className="bg-muted/40 rounded px-2 py-1 text-xs">{ev}</div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
