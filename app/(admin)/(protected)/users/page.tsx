import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Plus, UserIcon } from 'lucide-react'
import { getUsers } from '@/lib/actions/users'
import { DeleteUserButton } from '@/components/admin/delete-user-button'

const ROLE_VARIANTS: Record<string, 'default' | 'secondary' | 'outline'> = {
  administrator: 'default',
  editor: 'secondary',
  author: 'secondary',
  contributor: 'outline',
  subscriber: 'outline',
}

export default async function UsersPage() {
  const userList = await getUsers()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Users</h1>
          <p className="text-muted-foreground mt-1">Manage site users and roles.</p>
        </div>
        <Button asChild>
          <Link href="/users/new">
            <Plus className="h-4 w-4" />
            Add User
          </Link>
        </Button>
      </div>

      {userList.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <UserIcon className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-foreground">No users yet</h3>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Name</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Username</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Email</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Role</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Registered</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {userList.map((user) => (
                  <tr key={user.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-medium text-foreground">{user.displayName}</td>
                    <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{user.userLogin}</td>
                    <td className="px-4 py-3 text-muted-foreground">{user.userEmail}</td>
                    <td className="px-4 py-3">
                      <Badge variant={ROLE_VARIANTS[user.role] ?? 'outline'} className="capitalize">
                        {user.role}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {user.userRegistered
                        ? new Date(user.userRegistered).toLocaleDateString()
                        : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/users/${user.id}`}>Edit</Link>
                        </Button>
                        <DeleteUserButton userId={user.id} userName={user.displayName} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  )
}
