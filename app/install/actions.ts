'use server'

import { redirect } from 'next/navigation'
import bcryptjs from 'bcryptjs'

export async function testDatabaseConnection(
  url: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const postgres = (await import('postgres')).default
    const client = postgres(url, { max: 1, connect_timeout: 5 })
    await client`SELECT 1`
    await client.end()
    return { success: true }
  } catch (e) {
    return { success: false, error: String(e) }
  }
}

export async function checkTablesExist(
  url: string
): Promise<{ exists: boolean }> {
  try {
    const postgres = (await import('postgres')).default
    const client = postgres(url, { max: 1, connect_timeout: 5 })
    const result = await client`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'pl_options'
      ) AS exists
    `
    await client.end()
    return { exists: result[0]?.exists === true }
  } catch {
    return { exists: false }
  }
}

export async function runMigrations(): Promise<{
  success: boolean
  tables: string[]
  error?: string
}> {
  const url = process.env.DATABASE_URL
  if (!url) {
    return { success: false, tables: [], error: 'DATABASE_URL not set' }
  }

  const postgres = (await import('postgres')).default
  const client = postgres(url, { max: 1 })

  const tables: string[] = []

  try {
    await client`
      CREATE TABLE IF NOT EXISTS pl_users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_login TEXT NOT NULL UNIQUE,
        user_pass TEXT NOT NULL,
        user_nicename TEXT NOT NULL,
        user_email TEXT NOT NULL UNIQUE,
        user_url TEXT DEFAULT '',
        user_registered TIMESTAMPTZ DEFAULT NOW(),
        user_activation_key TEXT DEFAULT '',
        user_status INTEGER DEFAULT 0,
        display_name TEXT NOT NULL
      )
    `
    tables.push('pl_users')

    await client`
      CREATE TABLE IF NOT EXISTS pl_usermeta (
        umeta_id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
        user_id UUID NOT NULL REFERENCES pl_users(id) ON DELETE CASCADE,
        meta_key TEXT,
        meta_value TEXT
      )
    `
    tables.push('pl_usermeta')

    await client`
      CREATE TABLE IF NOT EXISTS pl_posts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        post_author UUID REFERENCES pl_users(id),
        post_date TIMESTAMPTZ DEFAULT NOW(),
        post_date_gmt TIMESTAMPTZ DEFAULT NOW(),
        post_content TEXT DEFAULT '',
        post_content_json JSONB,
        post_title TEXT NOT NULL DEFAULT '',
        post_excerpt TEXT DEFAULT '',
        post_status TEXT NOT NULL DEFAULT 'draft',
        comment_status TEXT NOT NULL DEFAULT 'open',
        ping_status TEXT NOT NULL DEFAULT 'open',
        post_password TEXT DEFAULT '',
        post_name TEXT NOT NULL DEFAULT '',
        to_ping TEXT DEFAULT '',
        pinged TEXT DEFAULT '',
        post_modified TIMESTAMPTZ DEFAULT NOW(),
        post_modified_gmt TIMESTAMPTZ DEFAULT NOW(),
        post_content_filtered TEXT DEFAULT '',
        post_parent UUID,
        guid TEXT DEFAULT '',
        menu_order INTEGER DEFAULT 0,
        post_type TEXT NOT NULL DEFAULT 'post',
        post_mime_type TEXT DEFAULT '',
        comment_count BIGINT DEFAULT 0
      )
    `
    tables.push('pl_posts')

    await client`
      CREATE TABLE IF NOT EXISTS pl_postmeta (
        meta_id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
        post_id UUID NOT NULL REFERENCES pl_posts(id) ON DELETE CASCADE,
        meta_key TEXT,
        meta_value TEXT
      )
    `
    tables.push('pl_postmeta')

    await client`
      CREATE TABLE IF NOT EXISTS pl_terms (
        term_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        slug TEXT NOT NULL,
        term_group BIGINT DEFAULT 0
      )
    `
    tables.push('pl_terms')

    await client`
      CREATE UNIQUE INDEX IF NOT EXISTS pl_terms_slug_idx ON pl_terms(slug)
    `

    await client`
      CREATE TABLE IF NOT EXISTS pl_term_taxonomy (
        term_taxonomy_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        term_id UUID NOT NULL REFERENCES pl_terms(term_id) ON DELETE CASCADE,
        taxonomy TEXT NOT NULL,
        description TEXT DEFAULT '',
        parent UUID,
        count BIGINT DEFAULT 0
      )
    `
    tables.push('pl_term_taxonomy')

    await client`
      CREATE TABLE IF NOT EXISTS pl_term_relationships (
        object_id UUID NOT NULL REFERENCES pl_posts(id) ON DELETE CASCADE,
        term_taxonomy_id UUID NOT NULL REFERENCES pl_term_taxonomy(term_taxonomy_id) ON DELETE CASCADE,
        term_order INTEGER DEFAULT 0,
        PRIMARY KEY (object_id, term_taxonomy_id)
      )
    `
    tables.push('pl_term_relationships')

    await client`
      CREATE TABLE IF NOT EXISTS pl_termmeta (
        meta_id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
        term_id UUID NOT NULL REFERENCES pl_terms(term_id) ON DELETE CASCADE,
        meta_key TEXT,
        meta_value TEXT
      )
    `
    tables.push('pl_termmeta')

    await client`
      CREATE TABLE IF NOT EXISTS pl_comments (
        comment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        comment_post_id UUID REFERENCES pl_posts(id) ON DELETE CASCADE,
        comment_author TEXT NOT NULL DEFAULT '',
        comment_author_email TEXT NOT NULL DEFAULT '',
        comment_author_url TEXT DEFAULT '',
        comment_author_ip TEXT DEFAULT '',
        comment_date TIMESTAMPTZ DEFAULT NOW(),
        comment_date_gmt TIMESTAMPTZ DEFAULT NOW(),
        comment_content TEXT NOT NULL,
        comment_karma INTEGER DEFAULT 0,
        comment_approved TEXT NOT NULL DEFAULT '1',
        comment_agent TEXT DEFAULT '',
        comment_type TEXT DEFAULT 'comment',
        comment_parent UUID,
        user_id UUID
      )
    `
    tables.push('pl_comments')

    await client`
      CREATE TABLE IF NOT EXISTS pl_commentmeta (
        meta_id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
        comment_id UUID NOT NULL REFERENCES pl_comments(comment_id) ON DELETE CASCADE,
        meta_key TEXT,
        meta_value TEXT
      )
    `
    tables.push('pl_commentmeta')

    await client`
      CREATE TABLE IF NOT EXISTS pl_options (
        option_id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
        option_name TEXT NOT NULL UNIQUE,
        option_value TEXT NOT NULL DEFAULT '',
        autoload TEXT NOT NULL DEFAULT 'yes'
      )
    `
    tables.push('pl_options')

    await client`
      CREATE TABLE IF NOT EXISTS pl_links (
        link_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        link_url TEXT NOT NULL DEFAULT '',
        link_name TEXT NOT NULL DEFAULT '',
        link_image TEXT DEFAULT '',
        link_target TEXT DEFAULT '',
        link_description TEXT DEFAULT '',
        link_visible TEXT NOT NULL DEFAULT 'Y',
        link_owner UUID REFERENCES pl_users(id),
        link_rating INTEGER DEFAULT 0,
        link_updated TIMESTAMPTZ DEFAULT NOW(),
        link_rel TEXT DEFAULT '',
        link_notes TEXT DEFAULT '',
        link_rss TEXT DEFAULT ''
      )
    `
    tables.push('pl_links')

    await client.end()
    return { success: true, tables }
  } catch (e) {
    await client.end()
    return { success: false, tables, error: String(e) }
  }
}

export interface SetupData {
  siteTitle: string
  siteUrl: string
  adminEmail: string
  adminUsername: string
  adminPassword: string
  timezone: string
}

export async function setupSite(
  data: SetupData
): Promise<{ success: boolean; error?: string }> {
  const url = process.env.DATABASE_URL
  if (!url) {
    return { success: false, error: 'DATABASE_URL not set' }
  }

  try {
    const postgres = (await import('postgres')).default
    const client = postgres(url, { max: 1 })

    const passwordHash = await bcryptjs.hash(data.adminPassword, 12)
    const nicename = data.adminUsername.toLowerCase().replace(/\s+/g, '-')

    // Create admin user
    const [user] = await client`
      INSERT INTO pl_users (user_login, user_pass, user_nicename, user_email, display_name)
      VALUES (${data.adminUsername}, ${passwordHash}, ${nicename}, ${data.adminEmail}, ${data.adminUsername})
      RETURNING id
    `

    // Set admin capabilities
    await client`
      INSERT INTO pl_usermeta (user_id, meta_key, meta_value)
      VALUES (
        ${user.id},
        'pl_capabilities',
        ${JSON.stringify({ administrator: true })}
      )
    `

    // Seed default options
    const defaultOptions = [
      { name: 'siteurl', value: data.siteUrl },
      { name: 'blogname', value: data.siteTitle },
      { name: 'blogdescription', value: 'Just another Pressload site' },
      { name: 'admin_email', value: data.adminEmail },
      { name: 'pressload_version', value: '1.0.0' },
      { name: 'db_version', value: '1' },
      { name: 'show_on_front', value: 'posts' },
      { name: 'posts_per_page', value: '10' },
      { name: 'default_comment_status', value: 'open' },
      { name: 'timezone_string', value: data.timezone || 'UTC' },
      { name: 'date_format', value: 'F j, Y' },
      { name: 'time_format', value: 'g:i a' },
      { name: 'template', value: 'pressload-default' },
      { name: 'stylesheet', value: 'pressload-default' },
      { name: 'active_plugins', value: JSON.stringify([]) },
      { name: 'permalink_structure', value: '/%postname%/' },
      { name: 'pressload_installed', value: '1' },
    ]

    for (const opt of defaultOptions) {
      await client`
        INSERT INTO pl_options (option_name, option_value)
        VALUES (${opt.name}, ${opt.value})
        ON CONFLICT (option_name) DO UPDATE SET option_value = EXCLUDED.option_value
      `
    }

    // Create default "Uncategorised" term
    const [term] = await client`
      INSERT INTO pl_terms (name, slug) VALUES ('Uncategorised', 'uncategorised') RETURNING term_id
    `
    await client`
      INSERT INTO pl_term_taxonomy (term_id, taxonomy, description)
      VALUES (${term.term_id}, 'category', 'Default category')
    `

    // Create "Hello World!" post
    await client`
      INSERT INTO pl_posts (post_author, post_title, post_content, post_name, post_status, post_type)
      VALUES (
        ${user.id},
        'Hello World!',
        '<p>Welcome to Pressload. This is your first post. Edit or delete it, then start writing!</p>',
        'hello-world',
        'publish',
        'post'
      )
    `

    // Create "Sample Page"
    await client`
      INSERT INTO pl_posts (post_author, post_title, post_content, post_name, post_status, post_type)
      VALUES (
        ${user.id},
        'Sample Page',
        '<p>This is an example page. It is different from a blog post.</p>',
        'sample-page',
        'publish',
        'page'
      )
    `

    await client.end()
    return { success: true }
  } catch (e) {
    return { success: false, error: String(e) }
  }
}
