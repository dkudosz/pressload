'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth/config'
import { db } from '@/lib/db'
import { users, usermeta } from '@/lib/db/schema'
import { eq, and, desc } from 'drizzle-orm'
import bcrypt from 'bcryptjs'
import { createHash, randomBytes } from 'crypto'

function hashApiKey(key: string): string {
  return createHash('sha256').update(key).digest('hex')
}

export type UserRole = 'administrator' | 'editor' | 'author' | 'contributor' | 'subscriber'

export interface UserListItem {
  id: string
  displayName: string
  userEmail: string
  userLogin: string
  role: UserRole
  userRegistered: Date | null
}

async function requireAuth() {
  const session = await auth()
  if (!session) throw new Error('Unauthorized')
  return session
}

async function getUserRole(userId: string): Promise<UserRole> {
  const meta = await db.query.usermeta.findFirst({
    where: and(eq(usermeta.userId, userId), eq(usermeta.metaKey, 'pl_user_role')),
    columns: { metaValue: true },
  })
  return (meta?.metaValue as UserRole) ?? 'subscriber'
}

async function setUserRole(userId: string, role: UserRole): Promise<void> {
  const existing = await db.query.usermeta.findFirst({
    where: and(eq(usermeta.userId, userId), eq(usermeta.metaKey, 'pl_user_role')),
    columns: { umetaId: true },
  })
  if (existing) {
    await db
      .update(usermeta)
      .set({ metaValue: role })
      .where(and(eq(usermeta.userId, userId), eq(usermeta.metaKey, 'pl_user_role')))
  } else {
    await db.insert(usermeta).values({ userId, metaKey: 'pl_user_role', metaValue: role })
  }

  // Also update pl_capabilities to keep parity with WordPress-style checks
  const caps = JSON.stringify({ [role]: true })
  const existingCaps = await db.query.usermeta.findFirst({
    where: and(eq(usermeta.userId, userId), eq(usermeta.metaKey, 'pl_capabilities')),
    columns: { umetaId: true },
  })
  if (existingCaps) {
    await db
      .update(usermeta)
      .set({ metaValue: caps })
      .where(and(eq(usermeta.userId, userId), eq(usermeta.metaKey, 'pl_capabilities')))
  } else {
    await db.insert(usermeta).values({ userId, metaKey: 'pl_capabilities', metaValue: caps })
  }
}

async function getUserMeta(userId: string, key: string): Promise<string> {
  const row = await db.query.usermeta.findFirst({
    where: and(eq(usermeta.userId, userId), eq(usermeta.metaKey, key)),
    columns: { metaValue: true },
  })
  return row?.metaValue ?? ''
}

async function setUserMeta(userId: string, key: string, value: string): Promise<void> {
  const existing = await db.query.usermeta.findFirst({
    where: and(eq(usermeta.userId, userId), eq(usermeta.metaKey, key)),
    columns: { umetaId: true },
  })
  if (existing) {
    await db
      .update(usermeta)
      .set({ metaValue: value })
      .where(and(eq(usermeta.userId, userId), eq(usermeta.metaKey, key)))
  } else {
    await db.insert(usermeta).values({ userId, metaKey: key, metaValue: value })
  }
}

export async function getUsers(): Promise<UserListItem[]> {
  const allUsers = await db.query.users.findMany({
    orderBy: [desc(users.userRegistered)],
  })

  const result: UserListItem[] = []
  for (const u of allUsers) {
    const role = await getUserRole(u.id)
    result.push({
      id: u.id,
      displayName: u.displayName,
      userEmail: u.userEmail,
      userLogin: u.userLogin,
      role,
      userRegistered: u.userRegistered,
    })
  }
  return result
}

export async function getUserById(id: string): Promise<{
  id: string
  displayName: string
  userEmail: string
  userLogin: string
  role: UserRole
  bio: string
  avatarUrl: string
} | null> {
  const user = await db.query.users.findFirst({ where: eq(users.id, id) })
  if (!user) return null

  const role = await getUserRole(id)
  const bio = await getUserMeta(id, 'description')
  const avatarUrl = await getUserMeta(id, 'avatar_url')

  return {
    id: user.id,
    displayName: user.displayName,
    userEmail: user.userEmail,
    userLogin: user.userLogin,
    role,
    bio,
    avatarUrl,
  }
}

export async function createUser(formData: FormData): Promise<void> {
  await requireAuth()

  const displayName = (formData.get('displayName') as string) ?? ''
  const userEmail = (formData.get('userEmail') as string) ?? ''
  const userLogin = (formData.get('userLogin') as string) ?? ''
  const password = (formData.get('password') as string) ?? ''
  const role = ((formData.get('role') as string) ?? 'subscriber') as UserRole

  if (!userEmail || !userLogin || !password) throw new Error('Email, username, and password are required')

  const existing = await db.query.users.findFirst({
    where: eq(users.userEmail, userEmail),
    columns: { id: true },
  })
  if (existing) throw new Error('A user with that email already exists')

  const existingLogin = await db.query.users.findFirst({
    where: eq(users.userLogin, userLogin),
    columns: { id: true },
  })
  if (existingLogin) throw new Error('A user with that username already exists')

  const hash = await bcrypt.hash(password, 12)
  const nicename = userLogin.toLowerCase().replace(/[^a-z0-9-]/g, '-')

  const [user] = await db
    .insert(users)
    .values({
      displayName: displayName || userLogin,
      userEmail,
      userLogin,
      userPass: hash,
      userNicename: nicename,
      userRegistered: new Date(),
    })
    .returning()

  await setUserRole(user.id, role)

  revalidatePath('/users')
  redirect('/users')
}

export async function updateUser(id: string, formData: FormData): Promise<void> {
  await requireAuth()

  const displayName = (formData.get('displayName') as string) ?? ''
  const userEmail = (formData.get('userEmail') as string) ?? ''
  const role = ((formData.get('role') as string) ?? 'subscriber') as UserRole
  const bio = (formData.get('bio') as string) ?? ''
  const avatarUrl = (formData.get('avatarUrl') as string) ?? ''
  const newPassword = (formData.get('newPassword') as string) ?? ''

  const existing = await db.query.users.findFirst({
    where: eq(users.id, id),
    columns: { userEmail: true },
  })
  if (!existing) throw new Error('User not found')

  if (userEmail !== existing.userEmail) {
    const taken = await db.query.users.findFirst({
      where: eq(users.userEmail, userEmail),
      columns: { id: true },
    })
    if (taken) throw new Error('That email is already in use')
  }

  const updateValues: Record<string, unknown> = { displayName, userEmail }
  if (newPassword) {
    updateValues.userPass = await bcrypt.hash(newPassword, 12)
  }

  await db.update(users).set(updateValues).where(eq(users.id, id))
  await setUserRole(id, role)
  await setUserMeta(id, 'description', bio)
  await setUserMeta(id, 'avatar_url', avatarUrl)

  revalidatePath('/users')
  revalidatePath(`/users/${id}`)
  redirect('/users')
}

export async function deleteUser(id: string): Promise<void> {
  const session = await requireAuth()
  if (session.user.id === id) throw new Error('You cannot delete your own account')

  await db.delete(users).where(eq(users.id, id))
  revalidatePath('/users')
}

export async function updateProfile(formData: FormData): Promise<void> {
  const session = await requireAuth()
  const id = session.user.id

  const displayName = (formData.get('displayName') as string) ?? ''
  const userEmail = (formData.get('userEmail') as string) ?? ''
  const bio = (formData.get('bio') as string) ?? ''
  const avatarUrl = (formData.get('avatarUrl') as string) ?? ''
  const currentPassword = (formData.get('currentPassword') as string) ?? ''
  const newPassword = (formData.get('newPassword') as string) ?? ''

  const user = await db.query.users.findFirst({ where: eq(users.id, id) })
  if (!user) throw new Error('User not found')

  if (userEmail !== user.userEmail) {
    const taken = await db.query.users.findFirst({
      where: eq(users.userEmail, userEmail),
      columns: { id: true },
    })
    if (taken) throw new Error('That email is already in use')
  }

  const updateValues: Record<string, unknown> = { displayName, userEmail }
  if (newPassword) {
    if (!currentPassword) throw new Error('Current password is required to set a new password')
    const valid = await bcrypt.compare(currentPassword, user.userPass)
    if (!valid) throw new Error('Current password is incorrect')
    updateValues.userPass = await bcrypt.hash(newPassword, 12)
  }

  await db.update(users).set(updateValues).where(eq(users.id, id))
  await setUserMeta(id, 'description', bio)
  await setUserMeta(id, 'avatar_url', avatarUrl)

  revalidatePath('/profile')
}

export async function generateApiKey(): Promise<string> {
  const session = await requireAuth()
  const key = randomBytes(32).toString('hex')
  const hash = hashApiKey(key)
  await setUserMeta(session.user.id, 'api_key_hash', hash)
  revalidatePath('/profile')
  return key
}

export async function revokeApiKey(): Promise<void> {
  const session = await requireAuth()
  await db
    .delete(usermeta)
    .where(and(eq(usermeta.userId, session.user.id), eq(usermeta.metaKey, 'api_key_hash')))
  revalidatePath('/profile')
}

export async function hasApiKey(): Promise<boolean> {
  const session = await requireAuth()
  const row = await db.query.usermeta.findFirst({
    where: and(eq(usermeta.userId, session.user.id), eq(usermeta.metaKey, 'api_key_hash')),
    columns: { umetaId: true },
  })
  return !!row
}
