import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Plus, FileText } from 'lucide-react'

export default function PostsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Posts</h1>
          <p className="text-muted-foreground mt-1">Manage your blog posts.</p>
        </div>
        <Button asChild>
          <Link href="/posts/new">
            <Plus className="h-4 w-4" />
            New Post
          </Link>
        </Button>
      </div>

      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <FileText className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium text-foreground">No posts yet</h3>
          <p className="text-sm text-muted-foreground mt-1 mb-4">
            Get started by creating your first post.
          </p>
          <Button asChild>
            <Link href="/posts/new">
              <Plus className="h-4 w-4" />
              Create Post
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
