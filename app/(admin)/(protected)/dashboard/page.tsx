import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FileText, File, Image, Users } from 'lucide-react'

const stats = [
  { label: 'Posts', value: '—', icon: FileText, href: '/posts' },
  { label: 'Pages', value: '—', icon: File, href: '/pages' },
  { label: 'Media', value: '—', icon: Image, href: '/media' },
  { label: 'Users', value: '—', icon: Users, href: '/users' },
]

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Welcome to Pressload.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map(({ label, value, icon: Icon }) => (
          <Card key={label}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Getting Started</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>Your Pressload site is ready. Here are some things to do next:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Write your first post under <strong className="text-foreground">Posts</strong></li>
            <li>Configure your site under <strong className="text-foreground">Settings</strong></li>
            <li>Upload images in the <strong className="text-foreground">Media</strong> library</li>
            <li>Manage plugins and themes</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
