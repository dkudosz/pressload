import fs from 'fs/promises'
import path from 'path'
import { hooks } from '@/lib/hooks'
import type { PluginInfo, PluginManifest, PluginModule } from '@/lib/plugins/types'

const PLUGINS_DIR = path.join(process.cwd(), 'plugins')

export async function getAllPlugins(): Promise<PluginInfo[]> {
  const activeNames = await getActivePluginNames()
  const result: PluginInfo[] = []

  let dirs: string[] = []
  try {
    dirs = await fs.readdir(PLUGINS_DIR)
  } catch {
    return result // plugins/ dir doesn't exist yet
  }

  for (const dirName of dirs) {
    const manifestPath = path.join(PLUGINS_DIR, dirName, 'pressload.plugin.json')
    try {
      const raw = await fs.readFile(manifestPath, 'utf-8')
      const manifest = JSON.parse(raw) as PluginManifest
      result.push({ manifest, dirName, isActive: activeNames.includes(manifest.name) })
    } catch {
      // skip directories without a valid manifest
    }
  }

  return result
}

export async function getActivePluginNames(): Promise<string[]> {
  try {
    const { db } = await import('@/lib/db')
    const { options } = await import('@/lib/db/schema')
    const { eq } = await import('drizzle-orm')
    const row = await db.query.options.findFirst({
      where: eq(options.optionName, 'active_plugins'),
      columns: { optionValue: true },
    })
    if (!row?.optionValue) return []
    return JSON.parse(row.optionValue) as string[]
  } catch {
    return []
  }
}

export async function initializePlugins(): Promise<void> {
  const activeNames = await getActivePluginNames()
  if (activeNames.length === 0) return

  let dirs: string[] = []
  try {
    dirs = await fs.readdir(PLUGINS_DIR)
  } catch {
    return
  }

  for (const dirName of dirs) {
    const manifestPath = path.join(PLUGINS_DIR, dirName, 'pressload.plugin.json')
    try {
      const raw = await fs.readFile(manifestPath, 'utf-8')
      const manifest = JSON.parse(raw) as PluginManifest
      if (!activeNames.includes(manifest.name)) continue

      const entryPath = path.join(PLUGINS_DIR, dirName, manifest.entry.replace(/^\.\//, ''))
      // Dynamic import of the plugin entry module
      const mod = (await import(/* webpackIgnore: true */ `file://${entryPath}`)) as Partial<PluginModule>
      if (typeof mod.register === 'function') {
        mod.register(hooks)
      }
    } catch {
      // don't crash on broken plugins
    }
  }
}
