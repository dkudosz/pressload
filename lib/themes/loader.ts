import fs from 'fs/promises'
import path from 'path'
import type { ThemeInfo, ThemeManifest } from '@/lib/themes/types'

const THEMES_DIR = path.join(process.cwd(), 'themes')

export async function getAllThemes(): Promise<ThemeInfo[]> {
  const activeThemeName = await getActiveThemeName()
  const result: ThemeInfo[] = []

  let dirs: string[] = []
  try {
    dirs = await fs.readdir(THEMES_DIR)
  } catch {
    return result
  }

  for (const dirName of dirs) {
    const manifestPath = path.join(THEMES_DIR, dirName, 'pressload.theme.json')
    try {
      const raw = await fs.readFile(manifestPath, 'utf-8')
      const manifest = JSON.parse(raw) as ThemeManifest
      result.push({ manifest, dirName, isActive: manifest.name === activeThemeName })
    } catch {
      // skip
    }
  }

  return result
}

export async function getActiveThemeName(): Promise<string> {
  try {
    const { db } = await import('@/lib/db')
    const { options } = await import('@/lib/db/schema')
    const { eq } = await import('drizzle-orm')
    const row = await db.query.options.findFirst({
      where: eq(options.optionName, 'template'),
      columns: { optionValue: true },
    })
    return row?.optionValue ?? 'pressload-default'
  } catch {
    return 'pressload-default'
  }
}

export async function getActiveTheme(): Promise<ThemeInfo | null> {
  const name = await getActiveThemeName()
  let dirs: string[] = []
  try {
    dirs = await fs.readdir(THEMES_DIR)
  } catch {
    return null
  }

  for (const dirName of dirs) {
    const manifestPath = path.join(THEMES_DIR, dirName, 'pressload.theme.json')
    try {
      const raw = await fs.readFile(manifestPath, 'utf-8')
      const manifest = JSON.parse(raw) as ThemeManifest
      if (manifest.name === name) return { manifest, dirName, isActive: true }
    } catch {}
  }
  return null
}
