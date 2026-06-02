export interface ThemeManifest {
  name: string
  version: string
  description: string
  author?: string
  screenshot?: string
  locations?: string[]
  supports?: string[]
  templates?: {
    index?: string
    single?: string
    page?: string
    archive?: string
    '404'?: string
  }
}

export interface ThemeInfo {
  manifest: ThemeManifest
  dirName: string
  isActive: boolean
}
