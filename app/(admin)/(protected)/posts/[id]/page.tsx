import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function EditPostPage({ params }: { params: { id: string } }) {
  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/posts">
            <ArrowLeft className="h-4 w-4" />
            Posts
          </Link>
        </Button>
        <h1 className="text-2xl font-bold text-foreground">Edit Post</h1>
        <span className="text-xs text-muted-foreground font-mono">{params.id}</span>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Post Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" placeholder="Enter post title..." />
          </div>
          <div className="space-y-2">
            <Label htmlFor="content">Content</Label>
            <textarea
              id="content"
              placeholder="Post content..."
              className="flex min-h-[200px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-y"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="outline">Save Draft</Button>
            <Button>Publish</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
