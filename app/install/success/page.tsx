import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

export default function InstallSuccessPage() {
  return (
    <Card>
      <CardHeader className="text-center pb-2">
        <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center">
          <svg
            className="h-8 w-8 text-primary"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <CardTitle className="text-2xl">Installation Complete!</CardTitle>
        <CardDescription className="text-base mt-2">
          Pressload has been installed successfully. Your site is ready.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 pt-4">
        <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-2">
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">Next steps:</span>
          </p>
          <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
            <li>Sign in to your dashboard</li>
            <li>Configure your site settings</li>
            <li>Write your first post</li>
            <li>Install plugins and choose a theme</li>
          </ul>
        </div>
        <Button asChild className="w-full">
          <Link href="/signin">Sign in to your dashboard</Link>
        </Button>
      </CardContent>
    </Card>
  )
}
