import { db } from '@/lib/db'
import { options } from '@/lib/db/schema'
import { eq, inArray } from 'drizzle-orm'

export async function getOption(name: string, defaultValue = ''): Promise<string> {
  const row = await db.query.options.findFirst({
    where: eq(options.optionName, name),
    columns: { optionValue: true },
  })
  return row?.optionValue ?? defaultValue
}

export async function updateOption(name: string, value: string): Promise<void> {
  await db
    .insert(options)
    .values({ optionName: name, optionValue: value })
    .onConflictDoUpdate({
      target: options.optionName,
      set: { optionValue: value },
    })
}

export async function deleteOption(name: string): Promise<void> {
  await db.delete(options).where(eq(options.optionName, name))
}

export async function getOptions(names: string[]): Promise<Record<string, string>> {
  if (names.length === 0) return {}
  const rows = await db.query.options.findMany({
    where: inArray(options.optionName, names),
    columns: { optionName: true, optionValue: true },
  })
  const result: Record<string, string> = {}
  for (const row of rows) {
    result[row.optionName] = row.optionValue
  }
  return result
}
