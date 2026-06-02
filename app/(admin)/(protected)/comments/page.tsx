import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MessageSquare } from 'lucide-react'
import { getComments } from '@/lib/actions/comments'
import { CommentActions } from '@/components/admin/comment-actions'
import { BulkCommentActions } from '@/components/admin/bulk-comment-actions'

const STATUS_CONFIG: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  '1': { label: 'Approved', variant: 'default' },
  '0': { label: 'Pending', variant: 'secondary' },
  spam: { label: 'Spam', variant: 'destructive' },
  trash: { label: 'Trash', variant: 'outline' },
}

const FILTER_TABS = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'approved', label: 'Approved' },
  { key: 'spam', label: 'Spam' },
  { key: 'trash', label: 'Trash' },
]

interface Props {
  searchParams: Promise<{ filter?: string }>
}

export default async function CommentsPage({ searchParams }: Props) {
  const { filter = 'all' } = await searchParams
  const commentList = await getComments(filter)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Comments</h1>
        <p className="text-muted-foreground mt-1">Moderate and manage comments.</p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 border-b border-border">
        {FILTER_TABS.map((tab) => (
          <Link
            key={tab.key}
            href={`/comments${tab.key === 'all' ? '' : `?filter=${tab.key}`}`}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              filter === tab.key || (tab.key === 'all' && !filter)
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      {commentList.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-foreground">No comments</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {filter === 'all' ? 'No comments have been submitted yet.' : `No ${filter} comments.`}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <BulkCommentActions commentIds={commentList.map((c) => c.commentId)} />
          <div className="divide-y divide-border">
            {commentList.map((comment) => {
              const statusCfg = STATUS_CONFIG[comment.commentApproved] ?? STATUS_CONFIG['0']
              return (
                <div key={comment.commentId} className="p-4 hover:bg-muted/20 transition-colors">
                  <div className="flex items-start gap-4">
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm text-foreground">
                          {comment.commentAuthor}
                        </span>
                        <span className="text-xs text-muted-foreground">{comment.commentAuthorEmail}</span>
                        <Badge variant={statusCfg.variant} className="text-xs">
                          {statusCfg.label}
                        </Badge>
                      </div>
                      <p className="text-sm text-foreground line-clamp-3">{comment.commentContent}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>
                          On:{' '}
                          <Link href={`/posts/${comment.postId}`} className="hover:underline">
                            {comment.postTitle}
                          </Link>
                        </span>
                        {comment.commentDate && (
                          <span>
                            {new Date(comment.commentDate).toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>
                    <CommentActions comment={comment} />
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      )}
    </div>
  )
}
