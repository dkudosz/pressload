#!/usr/bin/env node

/**
 * Pressload Setup Script
 * ---------------------
 * Guides the user through setting up a local PostgreSQL database,
 * generates .env.local, and runs migrations — then points them to
 * the web installer to create their admin account and site settings.
 *
 * Usage: node scripts/setup.js  (or: npm run setup)
 */

'use strict'

const readline = require('readline')
const { execSync, spawnSync } = require('child_process')
const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const os = require('os')

// ─── Colours ────────────────────────────────────────────────────────────────

const c = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
}

const ok   = (s) => console.log(`${c.green}✓${c.reset} ${s}`)
const warn = (s) => console.log(`${c.yellow}⚠${c.reset}  ${s}`)
const err  = (s) => console.log(`${c.red}✗${c.reset} ${s}`)
const info = (s) => console.log(`${c.cyan}ℹ${c.reset} ${s}`)
const step = (n, s) => console.log(`\n${c.bold}${c.blue}[${n}]${c.reset} ${c.bold}${s}${c.reset}`)
const line = () => console.log(`${c.dim}${'─'.repeat(60)}${c.reset}`)

// ─── Helpers ────────────────────────────────────────────────────────────────

function prompt(rl, question, defaultValue) {
  return new Promise((resolve) => {
    const display = defaultValue
      ? `${question} ${c.dim}[${defaultValue}]${c.reset}: `
      : `${question}: `
    rl.question(display, (answer) => {
      resolve(answer.trim() || defaultValue || '')
    })
  })
}

function promptPassword(question) {
  return new Promise((resolve) => {
    process.stdout.write(`${question}: `)
    const term = process.stdin.isTTY
    if (term) process.stdin.setRawMode(true)
    let password = ''
    const onData = (chunk) => {
      const char = chunk.toString()
      if (char === '\r' || char === '\n') {
        if (term) process.stdin.setRawMode(false)
        process.stdin.removeListener('data', onData)
        process.stdout.write('\n')
        resolve(password)
      } else if (char === '') {
        process.exit(1)
      } else if (char === '') {
        if (password.length > 0) {
          password = password.slice(0, -1)
          process.stdout.clearLine(0)
          process.stdout.cursorTo(0)
          process.stdout.write(`${question}: ${'*'.repeat(password.length)}`)
        }
      } else {
        password += char
        process.stdout.write('*')
      }
    }
    process.stdin.resume()
    process.stdin.on('data', onData)
  })
}

function commandExists(cmd) {
  try {
    execSync(`${process.platform === 'win32' ? 'where' : 'which'} ${cmd}`, {
      stdio: 'ignore',
    })
    return true
  } catch {
    return false
  }
}

function generateSecret(bytes = 48) {
  return crypto.randomBytes(bytes).toString('base64url')
}

function generatePassword(len = 16) {
  return crypto.randomBytes(len).toString('base64url').slice(0, len)
}

function isWindows() {
  return process.platform === 'win32'
}

function isMac() {
  return process.platform === 'darwin'
}

function isLinux() {
  return process.platform === 'linux'
}

function tryRun(cmd, opts = {}) {
  try {
    execSync(cmd, { stdio: 'pipe', ...opts })
    return true
  } catch {
    return false
  }
}

// ─── PostgreSQL auto-setup (macOS / Linux only) ──────────────────────────────

async function tryAutoSetupPostgres(rl) {
  if (!commandExists('psql')) {
    if (isMac()) {
      warn('psql not found. Attempting to install PostgreSQL via Homebrew…')
      if (!commandExists('brew')) {
        warn('Homebrew not found. Cannot auto-install PostgreSQL.')
        return false
      }
      console.log('')
      const result = spawnSync('brew', ['install', 'postgresql@16'], {
        stdio: 'inherit',
      })
      if (result.status !== 0) {
        err('Homebrew install failed.')
        return false
      }
      // Start the service
      tryRun('brew services start postgresql@16')
      ok('PostgreSQL installed and started.')
      return true
    } else if (isLinux()) {
      warn('psql not found. Attempting to install PostgreSQL via apt…')
      const result = spawnSync(
        'sudo',
        ['apt-get', 'install', '-y', 'postgresql', 'postgresql-client'],
        { stdio: 'inherit' }
      )
      if (result.status !== 0) {
        err('apt install failed.')
        return false
      }
      tryRun('sudo service postgresql start')
      ok('PostgreSQL installed and started.')
      return true
    }
  } else {
    ok('psql found.')
    return true
  }
  return false
}

async function createLocalDatabase(dbName, dbUser, dbPassword) {
  // Try to create user and database using psql as the postgres superuser.
  // On macOS (Homebrew), the current OS user typically is a superuser.
  const sudoPrefix = isLinux() ? 'sudo -u postgres ' : ''

  const createUser = `${sudoPrefix}psql -c "CREATE USER \\"${dbUser}\\" WITH PASSWORD '${dbPassword}';" 2>&1 || true`
  const createDb   = `${sudoPrefix}psql -c "CREATE DATABASE \\"${dbName}\\" OWNER \\"${dbUser}\\";" 2>&1 || true`
  const grantAll   = `${sudoPrefix}psql -c "GRANT ALL PRIVILEGES ON DATABASE \\"${dbName}\\" TO \\"${dbUser}\\";" 2>&1 || true`

  try {
    execSync(createUser, { shell: true, stdio: 'pipe' })
    execSync(createDb,   { shell: true, stdio: 'pipe' })
    execSync(grantAll,   { shell: true, stdio: 'pipe' })
    return true
  } catch (e) {
    return false
  }
}

// ─── Test DB connection ──────────────────────────────────────────────────────

async function testConnection(url) {
  try {
    // Use the postgres package that's already in node_modules
    const postgres = require('postgres')
    const client = postgres(url, { max: 1, connect_timeout: 8, idle_timeout: 2 })
    await client`SELECT 1`
    await client.end()
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e.message }
  }
}

// ─── Run migrations ──────────────────────────────────────────────────────────

function runMigrations(envPath) {
  info('Running database migrations…')
  const env = { ...process.env }

  // Load the .env.local we just wrote so drizzle-kit can see DATABASE_URL
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8')
    for (const line of content.split('\n')) {
      const [key, ...rest] = line.split('=')
      if (key && rest.length) {
        env[key.trim()] = rest.join('=').trim().replace(/^["']|["']$/g, '')
      }
    }
  }

  try {
    // Try drizzle-kit migrate first
    execSync('npx drizzle-kit migrate', {
      stdio: 'inherit',
      env,
      cwd: path.resolve(__dirname, '..'),
    })
    ok('Migrations applied.')
    return true
  } catch {
    // Fallback: call the inline migration runner via a tiny Node script
    try {
      const tmpScript = path.join(os.tmpdir(), 'pressload-migrate.mjs')
      fs.writeFileSync(
        tmpScript,
        `
import postgres from 'postgres'
const url = process.env.DATABASE_URL
if (!url) { console.error('DATABASE_URL not set'); process.exit(1) }
const db = postgres(url, { max: 1 })
// Create tables inline (mirrors app/install/actions.ts runMigrations)
const tables = [
  \`CREATE TABLE IF NOT EXISTS pl_users (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_login TEXT NOT NULL UNIQUE, user_pass TEXT NOT NULL, user_nicename TEXT NOT NULL, user_email TEXT NOT NULL UNIQUE, user_url TEXT DEFAULT '', user_registered TIMESTAMPTZ DEFAULT NOW(), user_activation_key TEXT DEFAULT '', user_status INTEGER DEFAULT 0, display_name TEXT NOT NULL)\`,
  \`CREATE TABLE IF NOT EXISTS pl_usermeta (umeta_id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY, user_id UUID NOT NULL REFERENCES pl_users(id) ON DELETE CASCADE, meta_key TEXT, meta_value TEXT)\`,
  \`CREATE TABLE IF NOT EXISTS pl_posts (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), post_author UUID REFERENCES pl_users(id), post_date TIMESTAMPTZ DEFAULT NOW(), post_date_gmt TIMESTAMPTZ DEFAULT NOW(), post_content TEXT DEFAULT '', post_content_json JSONB, post_title TEXT NOT NULL DEFAULT '', post_excerpt TEXT DEFAULT '', post_status TEXT NOT NULL DEFAULT 'draft', comment_status TEXT NOT NULL DEFAULT 'open', ping_status TEXT NOT NULL DEFAULT 'open', post_password TEXT DEFAULT '', post_name TEXT NOT NULL DEFAULT '', to_ping TEXT DEFAULT '', pinged TEXT DEFAULT '', post_modified TIMESTAMPTZ DEFAULT NOW(), post_modified_gmt TIMESTAMPTZ DEFAULT NOW(), post_content_filtered TEXT DEFAULT '', post_parent UUID, guid TEXT DEFAULT '', menu_order INTEGER DEFAULT 0, post_type TEXT NOT NULL DEFAULT 'post', post_mime_type TEXT DEFAULT '', comment_count BIGINT DEFAULT 0)\`,
  \`CREATE TABLE IF NOT EXISTS pl_postmeta (meta_id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY, post_id UUID NOT NULL REFERENCES pl_posts(id) ON DELETE CASCADE, meta_key TEXT, meta_value TEXT)\`,
  \`CREATE TABLE IF NOT EXISTS pl_terms (term_id UUID PRIMARY KEY DEFAULT gen_random_uuid(), name TEXT NOT NULL, slug TEXT NOT NULL, term_group BIGINT DEFAULT 0)\`,
  \`CREATE UNIQUE INDEX IF NOT EXISTS pl_terms_slug_idx ON pl_terms(slug)\`,
  \`CREATE TABLE IF NOT EXISTS pl_term_taxonomy (term_taxonomy_id UUID PRIMARY KEY DEFAULT gen_random_uuid(), term_id UUID NOT NULL REFERENCES pl_terms(term_id) ON DELETE CASCADE, taxonomy TEXT NOT NULL, description TEXT DEFAULT '', parent UUID, count BIGINT DEFAULT 0)\`,
  \`CREATE TABLE IF NOT EXISTS pl_term_relationships (object_id UUID NOT NULL REFERENCES pl_posts(id) ON DELETE CASCADE, term_taxonomy_id UUID NOT NULL REFERENCES pl_term_taxonomy(term_taxonomy_id) ON DELETE CASCADE, term_order INTEGER DEFAULT 0, PRIMARY KEY (object_id, term_taxonomy_id))\`,
  \`CREATE TABLE IF NOT EXISTS pl_termmeta (meta_id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY, term_id UUID NOT NULL REFERENCES pl_terms(term_id) ON DELETE CASCADE, meta_key TEXT, meta_value TEXT)\`,
  \`CREATE TABLE IF NOT EXISTS pl_comments (comment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(), comment_post_id UUID REFERENCES pl_posts(id) ON DELETE CASCADE, comment_author TEXT NOT NULL DEFAULT '', comment_author_email TEXT NOT NULL DEFAULT '', comment_author_url TEXT DEFAULT '', comment_author_ip TEXT DEFAULT '', comment_date TIMESTAMPTZ DEFAULT NOW(), comment_date_gmt TIMESTAMPTZ DEFAULT NOW(), comment_content TEXT NOT NULL, comment_karma INTEGER DEFAULT 0, comment_approved TEXT NOT NULL DEFAULT '1', comment_agent TEXT DEFAULT '', comment_type TEXT DEFAULT 'comment', comment_parent UUID, user_id UUID)\`,
  \`CREATE TABLE IF NOT EXISTS pl_commentmeta (meta_id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY, comment_id UUID NOT NULL REFERENCES pl_comments(comment_id) ON DELETE CASCADE, meta_key TEXT, meta_value TEXT)\`,
  \`CREATE TABLE IF NOT EXISTS pl_options (option_id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY, option_name TEXT NOT NULL UNIQUE, option_value TEXT NOT NULL DEFAULT '', autoload TEXT NOT NULL DEFAULT 'yes')\`,
  \`CREATE TABLE IF NOT EXISTS pl_links (link_id UUID PRIMARY KEY DEFAULT gen_random_uuid(), link_url TEXT NOT NULL DEFAULT '', link_name TEXT NOT NULL DEFAULT '', link_image TEXT DEFAULT '', link_target TEXT DEFAULT '', link_description TEXT DEFAULT '', link_visible TEXT NOT NULL DEFAULT 'Y', link_owner UUID REFERENCES pl_users(id), link_rating INTEGER DEFAULT 0, link_updated TIMESTAMPTZ DEFAULT NOW(), link_rel TEXT DEFAULT '', link_notes TEXT DEFAULT '', link_rss TEXT DEFAULT '')\`,
  \`CREATE TABLE IF NOT EXISTS pl_menus (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), name TEXT NOT NULL, slug TEXT NOT NULL UNIQUE, location TEXT, created_at TIMESTAMPTZ DEFAULT NOW())\`,
  \`CREATE TABLE IF NOT EXISTS pl_menu_items (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), menu_id UUID NOT NULL REFERENCES pl_menus(id) ON DELETE CASCADE, label TEXT NOT NULL, url TEXT NOT NULL, menu_order INTEGER DEFAULT 0, created_at TIMESTAMPTZ DEFAULT NOW())\`,
]
for (const sql of tables) { await db.unsafe(sql) }
await db.end()
console.log('Migrations complete.')
`
      )
      execSync(`node --input-type=module < ${tmpScript}`, {
        stdio: 'inherit',
        env,
        shell: true,
      })
      ok('Migrations applied (inline fallback).')
      return true
    } catch (e2) {
      err(`Migration failed: ${e2.message}`)
      return false
    }
  }
}

// ─── Write .env.local ────────────────────────────────────────────────────────

function writeEnvLocal(envPath, values) {
  let existing = {}
  if (fs.existsSync(envPath)) {
    for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
      const idx = line.indexOf('=')
      if (idx > 0) {
        const k = line.slice(0, idx).trim()
        const v = line.slice(idx + 1).trim().replace(/^["']|["']$/g, '')
        existing[k] = v
      }
    }
  }
  const merged = { ...existing, ...values }
  const content =
    Object.entries(merged)
      .map(([k, v]) => `${k}=${v}`)
      .join('\n') + '\n'
  fs.writeFileSync(envPath, content, 'utf8')
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log('')
  // PRESS
  console.log(
    `${c.bold}${c.magenta}  ██████╗ ██████╗ ███████╗███████╗███████╗${c.reset}`
  )
  console.log(
    `${c.bold}${c.magenta}  ██╔══██╗██╔══██╗██╔════╝██╔════╝██╔════╝${c.reset}`
  )
  console.log(
    `${c.bold}${c.magenta}  ██████╔╝██████╔╝█████╗  ███████╗███████╗${c.reset}`
  )
  console.log(
    `${c.bold}${c.magenta}  ██╔═══╝ ██╔══██╗██╔══╝  ╚════██║╚════██║${c.reset}`
  )
  console.log(
    `${c.bold}${c.magenta}  ██║     ██║  ██║███████╗███████║███████║${c.reset}`
  )
  console.log(
    `${c.bold}${c.magenta}  ╚═╝     ╚═╝  ╚═╝╚══════╝╚══════╝╚══════╝${c.reset}`
  )
  // LOAD
  console.log(
    `${c.bold}${c.magenta}  ██╗      ██████╗  █████╗ ██████╗ ${c.reset}`
  )
  console.log(
    `${c.bold}${c.magenta}  ██║     ██╔═══██╗██╔══██╗██╔══██╗${c.reset}`
  )
  console.log(
    `${c.bold}${c.magenta}  ██║     ██║   ██║███████║██║  ██║${c.reset}`
  )
  console.log(
    `${c.bold}${c.magenta}  ██║     ██║   ██║██╔══██║██║  ██║${c.reset}`
  )
  console.log(
    `${c.bold}${c.magenta}  ███████╗╚██████╔╝██║  ██║██████╔╝${c.reset}`
  )
  console.log(
    `${c.bold}${c.magenta}  ╚══════╝ ╚═════╝ ╚═╝  ╚═╝╚═════╝ ${c.reset}`
  )
  console.log('')
  console.log(`  ${c.bold}Pressload Setup${c.reset}  ${c.dim}— The WordPress-parity CMS${c.reset}`)
  console.log('')
  line()

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  })

  const rootDir = path.resolve(__dirname, '..')
  const envPath = path.join(rootDir, '.env.local')

  // ── Check if already installed ────────────────────────────────────────────

  if (fs.existsSync(envPath)) {
    const existingEnv = fs.readFileSync(envPath, 'utf8')
    if (existingEnv.includes('DATABASE_URL') && existingEnv.includes('AUTH_SECRET')) {
      warn('.env.local already exists with DATABASE_URL and AUTH_SECRET.')
      const overwrite = await prompt(rl, 'Overwrite and re-run setup? (yes/no)', 'no')
      if (overwrite.toLowerCase() !== 'yes' && overwrite.toLowerCase() !== 'y') {
        info('Setup cancelled. Run `npm run dev` and visit http://localhost:3000')
        rl.close()
        return
      }
    }
  }

  // ── Step 1: Database ──────────────────────────────────────────────────────

  step(1, 'Database Connection')

  let dbUrl = ''
  let autoCreated = false

  const platform = isWindows() ? 'Windows' : isMac() ? 'macOS' : 'Linux'
  info(`Platform: ${platform}`)

  if (!isWindows()) {
    const hasPsql = commandExists('psql')
    if (!hasPsql) {
      info('psql not found on PATH.')
    }

    console.log('')
    console.log(`  ${c.bold}Options:${c.reset}`)
    console.log(`  ${c.dim}1)${c.reset} Auto-create a local database ${hasPsql ? '' : c.dim + '(will install PostgreSQL)' + c.reset}`)
    console.log(`  ${c.dim}2)${c.reset} Enter an existing connection string`)
    console.log('')

    const choice = await prompt(rl, 'Choose', '1')

    if (choice === '1') {
      // Auto-create
      const psqlAvailable = hasPsql || (await tryAutoSetupPostgres(rl))

      if (!psqlAvailable) {
        warn('Could not set up PostgreSQL automatically. Falling back to manual entry.')
      } else {
        const dbName     = await prompt(rl, 'Database name', 'pressload')
        const dbUser     = await prompt(rl, 'Database user', 'pressload')
        const dbPassword = generatePassword()
        info(`Auto-generated DB password: ${c.bold}${dbPassword}${c.reset}`)

        const created = await createLocalDatabase(dbName, dbUser, dbPassword)
        if (created) {
          ok(`Database "${dbName}" created with user "${dbUser}".`)
          autoCreated = true
        } else {
          warn('Could not auto-create database. You may need to create it manually.')
          warn(`Run: createdb ${dbName}`)
        }

        dbUrl = `postgresql://${dbUser}:${dbPassword}@localhost:5432/${dbName}`
      }
    }
  }

  // Manual / fallback entry
  if (!dbUrl) {
    console.log('')
    info('Enter your PostgreSQL connection details:')
    const host     = await prompt(rl, '  Host', 'localhost')
    const port     = await prompt(rl, '  Port', '5432')
    const dbName   = await prompt(rl, '  Database name', 'pressload')
    const dbUser   = await prompt(rl, '  Username', 'postgres')
    process.stdout.write(`  Password: `)
    const dbPass   = await promptPassword('')
    dbUrl = `postgresql://${dbUser}:${encodeURIComponent(dbPass)}@${host}:${port}/${dbName}`
  }

  // ── Step 2: Test connection ───────────────────────────────────────────────

  step(2, 'Testing Connection')

  info(`Connecting to: ${c.dim}${dbUrl.replace(/:([^:@]+)@/, ':****@')}${c.reset}`)

  let attempts = 0
  let connected = false

  while (attempts < 3) {
    const result = await testConnection(dbUrl)
    if (result.ok) {
      connected = true
      ok('Connected successfully.')
      break
    }
    attempts++
    if (attempts < 3) {
      err(`Connection failed: ${result.error}`)
      warn(`Retrying… (${attempts}/3)`)
      await new Promise((r) => setTimeout(r, 2000))
    } else {
      err(`Connection failed after 3 attempts: ${result.error}`)
    }
  }

  if (!connected) {
    console.log('')
    warn('Could not connect to the database. Common fixes:')
    console.log(`  • Make sure PostgreSQL is running`)
    console.log(`  • Check host, port, username, and password`)
    console.log(`  • Create the database if it doesn't exist: ${c.bold}createdb pressload${c.reset}`)
    console.log('')
    const retry = await prompt(rl, 'Enter a new connection URL to retry (or press Enter to exit)', '')
    if (!retry) {
      err('Setup aborted. Fix the connection and run `npm run setup` again.')
      rl.close()
      process.exit(1)
    }
    dbUrl = retry
    const result2 = await testConnection(dbUrl)
    if (!result2.ok) {
      err(`Still failed: ${result2.error}`)
      err('Setup aborted.')
      rl.close()
      process.exit(1)
    }
    ok('Connected.')
  }

  // ── Step 3: Generate secrets + write .env.local ───────────────────────────

  step(3, 'Writing .env.local')

  const authSecret = generateSecret()
  const appUrl = await prompt(rl, 'Site URL', 'http://localhost:3000')

  writeEnvLocal(envPath, {
    DATABASE_URL: dbUrl,
    AUTH_SECRET: authSecret,
    NEXT_PUBLIC_APP_URL: appUrl,
  })

  ok(`.env.local written to ${envPath}`)

  // ── Step 4: Migrations ────────────────────────────────────────────────────

  step(4, 'Running Migrations')

  const migrated = runMigrations(envPath)
  if (!migrated) {
    warn('Migration failed — you can run `npm run db:migrate` manually.')
  }

  // ── Done ──────────────────────────────────────────────────────────────────

  rl.close()

  console.log('')
  line()
  console.log('')
  console.log(`${c.bold}${c.green}  Setup complete!${c.reset}`)
  console.log('')
  console.log(`  Next steps:`)
  console.log('')
  console.log(`  ${c.bold}1.${c.reset} Start the dev server:`)
  console.log(`     ${c.cyan}npm run dev${c.reset}`)
  console.log('')
  console.log(`  ${c.bold}2.${c.reset} Open the installer in your browser:`)
  console.log(`     ${c.cyan}${appUrl}/install${c.reset}`)
  console.log('')
  console.log(`  ${c.bold}3.${c.reset} Enter your site title and admin account details.`)
  console.log('')
  console.log(`  ${c.dim}Your .env.local has been created. Keep it safe — it contains your DB credentials.${c.reset}`)
  console.log('')
  line()
  console.log('')

  // Try to open browser (best-effort)
  const openUrl = `${appUrl}/install`
  try {
    if (isMac()) execSync(`open "${openUrl}"`, { stdio: 'ignore' })
    else if (isLinux()) execSync(`xdg-open "${openUrl}" 2>/dev/null || true`, { stdio: 'ignore', shell: true })
    else if (isWindows()) execSync(`start "" "${openUrl}"`, { stdio: 'ignore', shell: true })
  } catch {
    // Silently ignore — browser open is best-effort
  }
}

main().catch((e) => {
  err(`Unexpected error: ${e.message}`)
  process.exit(1)
})
