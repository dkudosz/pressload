import { ok, serverError } from '@/lib/api/response'
import { getOptions } from '@/lib/options'

// Public read-only settings — no auth required
export async function GET() {
  try {
    const opts = await getOptions([
      'blogname',
      'blogdescription',
      'siteurl',
      'timezone_string',
      'date_format',
      'time_format',
      'posts_per_page',
      'show_on_front',
      'permalink_structure',
      'default_comment_status',
    ])

    return ok({
      name: opts.blogname ?? '',
      description: opts.blogdescription ?? '',
      url: opts.siteurl ?? '',
      timezone: opts.timezone_string ?? 'UTC',
      date_format: opts.date_format ?? 'F j, Y',
      time_format: opts.time_format ?? 'g:i a',
      posts_per_page: parseInt(opts.posts_per_page ?? '10', 10),
      show_on_front: opts.show_on_front ?? 'posts',
      permalink_structure: opts.permalink_structure ?? '/%postname%/',
      default_comment_status: opts.default_comment_status ?? 'open',
    })
  } catch {
    return serverError()
  }
}
