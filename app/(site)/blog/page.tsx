const demoPosts = [
  { slug: 'hello-pressload', title: 'Hello Pressload' },
  { slug: 'using-app-router', title: 'Using Next.js App Router' },
]

export default function BlogIndexPage() {
  return (
    <section>
      <h1 className="text-3xl font-bold text-foreground">Blog</h1>
      <p className="text-muted-foreground mt-2 mb-6">
        This route can later render CMS-backed posts.
      </p>
      <ul className="space-y-2">
        {demoPosts.map((post) => (
          <li key={post.slug} className="text-foreground hover:text-primary transition-colors">
            {post.title}
          </li>
        ))}
      </ul>
    </section>
  )
}
