import { PostForm } from '@/components/admin/post-form'
import { getTerms } from '@/lib/actions/taxonomies'

export default async function NewPostPage() {
  const [categories, tags] = await Promise.all([
    getTerms('category'),
    getTerms('post_tag'),
  ])

  return <PostForm postType="post" categories={categories} tags={tags} />
}
