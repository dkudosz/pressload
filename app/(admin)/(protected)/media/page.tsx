import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Upload, Image } from 'lucide-react'

export default function MediaPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Media Library</h1>
          <p className="text-muted-foreground mt-1">Manage uploaded files and images.</p>
        </div>
        <Button>
          <Upload className="h-4 w-4" />
          Upload Files
        </Button>
      </div>

      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <Image className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium text-foreground">No media yet</h3>
          <p className="text-sm text-muted-foreground mt-1 mb-4">
            Upload images, videos, and documents.
          </p>
          <Button>
            <Upload className="h-4 w-4" />
            Upload Files
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
