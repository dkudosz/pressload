import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Plus, File } from 'lucide-react'

export default function PagesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Pages</h1>
          <p className="text-muted-foreground mt-1">Manage static pages.</p>
        </div>
        <Button>
          <Plus className="h-4 w-4" />
          New Page
        </Button>
      </div>

      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <File className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium text-foreground">No pages yet</h3>
          <p className="text-sm text-muted-foreground mt-1 mb-4">
            Create your first static page.
          </p>
          <Button>
            <Plus className="h-4 w-4" />
            Create Page
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
