'use server'

import { revalidatePath } from 'next/cache'
import { auth } from '@/lib/auth/config'
import { db } from '@/lib/db'
import { options } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { getAllThemes, getActiveThemeName } from '@/lib/themes/loader'

async function requireAuth() {
  const session = await auth()
  if (!session) throw new Error('Unauthorized')
}

async function setOption(name: string, value: string): Promise<void> {
  const existing = await db.query.options.findFirst({
    where: eq(options.optionName, name),
    columns: { optionId: true },
  })
  if (existing) {
    await db.update(options).set({ optionValue: value }).where(eq(options.optionName, name))
  } else {
    await db.insert(options).values({ optionName: name, optionValue: value })
  }
}

export async function activateTheme(themeName: string): Promise<void> {
  await requireAuth()
  await setOption('template', themeName)
  await setOption('stylesheet', themeName)
  revalidatePath('/themes')
  revalidatePath('/')
}

export { getAllThemes, getActiveThemeName }
