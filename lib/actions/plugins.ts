'use server'

import { revalidatePath } from 'next/cache'
import { auth } from '@/lib/auth/config'
import { db } from '@/lib/db'
import { options } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { getAllPlugins, getActivePluginNames } from '@/lib/plugins/loader'

async function requireAuth() {
  const session = await auth()
  if (!session) throw new Error('Unauthorized')
}

async function setActivePlugins(names: string[]): Promise<void> {
  const value = JSON.stringify(names)
  const existing = await db.query.options.findFirst({
    where: eq(options.optionName, 'active_plugins'),
    columns: { optionId: true },
  })
  if (existing) {
    await db.update(options).set({ optionValue: value }).where(eq(options.optionName, 'active_plugins'))
  } else {
    await db.insert(options).values({ optionName: 'active_plugins', optionValue: value })
  }
}

export async function activatePlugin(name: string): Promise<void> {
  await requireAuth()
  const current = await getActivePluginNames()
  if (!current.includes(name)) {
    await setActivePlugins([...current, name])
  }
  revalidatePath('/plugins')
}

export async function deactivatePlugin(name: string): Promise<void> {
  await requireAuth()
  const current = await getActivePluginNames()
  await setActivePlugins(current.filter((n) => n !== name))
  revalidatePath('/plugins')
}

export { getAllPlugins }
