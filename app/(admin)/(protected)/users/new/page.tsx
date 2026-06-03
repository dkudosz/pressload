import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft } from 'lucide-react'
import { createUser } from '@/lib/actions/users'

export default function NewUserPage() {
  return (
    <div className="space-y-6 max-w-xl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/users">
            <ArrowLeft className="h-4 w-4" />
            Users
          </Link>
        </Button>
        <h1 className="text-2xl font-bold text-foreground">Add New User</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">User Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createUser} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="displayName">Display Name</Label>
              <Input id="displayName" name="displayName" placeholder="Jane Doe" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="userEmail">Email *</Label>
              <Input id="userEmail" name="userEmail" type="email" required placeholder="jane@example.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="userLogin">Username *</Label>
              <Input id="userLogin" name="userLogin" required placeholder="janedoe" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password *</Label>
              <Input id="password" name="password" type="password" required placeholder="••••••••" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <select
                id="role"
                name="role"
                defaultValue="subscriber"
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="administrator">Administrator</option>
                <option value="editor">Editor</option>
                <option value="author">Author</option>
                <option value="contributor">Contributor</option>
                <option value="subscriber">Subscriber</option>
              </select>
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="submit">Add User</Button>
              <Button type="button" variant="outline" asChild>
                <Link href="/users">Cancel</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
