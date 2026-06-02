import type { HookSystem } from '@/lib/hooks'

export interface PluginManifest {
  name: string
  version: string
  description: string
  author?: string
  authorUrl?: string
  entry: string
  adminPages?: Array<{
    slug: string
    label: string
    icon?: string
  }>
}

export interface PluginModule {
  register: (hooks: HookSystem) => void
}

export interface PluginInfo {
  manifest: PluginManifest
  dirName: string
  isActive: boolean
}
