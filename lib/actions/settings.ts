'use server'

import { revalidatePath } from 'next/cache'
import { auth } from '@/lib/auth/config'
import { updateOption, getOptions } from '@/lib/options'

async function requireAuth() {
  const session = await auth()
  if (!session) throw new Error('Unauthorized')
  return session
}

export async function getGeneralSettings() {
  return getOptions([
    'blogname', 'blogdescription', 'siteurl', 'admin_email', 'timezone_string',
    'date_format', 'time_format', 'start_of_week',
  ])
}

export async function saveGeneralSettings(formData: FormData): Promise<void> {
  await requireAuth()
  const fields: [string, string][] = [
    ['blogname', (formData.get('blogname') as string) ?? ''],
    ['blogdescription', (formData.get('blogdescription') as string) ?? ''],
    ['siteurl', (formData.get('siteurl') as string) ?? ''],
    ['admin_email', (formData.get('admin_email') as string) ?? ''],
    ['timezone_string', (formData.get('timezone_string') as string) ?? ''],
    ['date_format', (formData.get('date_format') as string) ?? 'F j, Y'],
    ['time_format', (formData.get('time_format') as string) ?? 'g:i a'],
  ]
  await Promise.all(fields.map(([k, v]) => updateOption(k, v)))
  revalidatePath('/settings')
  revalidatePath('/')
}

export async function getReadingSettings() {
  return getOptions([
    'show_on_front', 'page_on_front', 'page_for_posts', 'posts_per_page',
    'posts_per_rss',
  ])
}

export async function saveReadingSettings(formData: FormData): Promise<void> {
  await requireAuth()
  const fields: [string, string][] = [
    ['show_on_front', (formData.get('show_on_front') as string) ?? 'posts'],
    ['page_on_front', (formData.get('page_on_front') as string) ?? ''],
    ['page_for_posts', (formData.get('page_for_posts') as string) ?? ''],
    ['posts_per_page', (formData.get('posts_per_page') as string) ?? '10'],
    ['posts_per_rss', (formData.get('posts_per_rss') as string) ?? '10'],
  ]
  await Promise.all(fields.map(([k, v]) => updateOption(k, v)))
  revalidatePath('/settings/reading')
  revalidatePath('/')
  revalidatePath('/blog')
}

export async function getDiscussionSettings() {
  return getOptions([
    'default_comment_status', 'default_ping_status', 'comment_moderation',
    'comment_registration', 'comments_notify', 'moderation_notify',
    'close_comments_for_old_posts', 'close_comments_days_old',
    'thread_comments', 'thread_comments_depth',
  ])
}

export async function saveDiscussionSettings(formData: FormData): Promise<void> {
  await requireAuth()
  const checkbox = (key: string) => (formData.get(key) === 'on' ? '1' : '0')
  const fields: [string, string][] = [
    ['default_comment_status', (formData.get('default_comment_status') as string) ?? 'open'],
    ['default_ping_status', (formData.get('default_ping_status') as string) ?? 'open'],
    ['comment_moderation', checkbox('comment_moderation')],
    ['comment_registration', checkbox('comment_registration')],
    ['comments_notify', checkbox('comments_notify')],
    ['moderation_notify', checkbox('moderation_notify')],
    ['close_comments_for_old_posts', checkbox('close_comments_for_old_posts')],
    ['close_comments_days_old', (formData.get('close_comments_days_old') as string) ?? '14'],
    ['thread_comments', checkbox('thread_comments')],
    ['thread_comments_depth', (formData.get('thread_comments_depth') as string) ?? '5'],
  ]
  await Promise.all(fields.map(([k, v]) => updateOption(k, v)))
  revalidatePath('/settings/discussion')
}

export async function getPermalinkSettings() {
  return getOptions(['permalink_structure'])
}

export async function savePermalinkSettings(formData: FormData): Promise<void> {
  await requireAuth()
  await updateOption('permalink_structure', (formData.get('permalink_structure') as string) ?? '/%postname%/')
  revalidatePath('/settings/permalinks')
}
