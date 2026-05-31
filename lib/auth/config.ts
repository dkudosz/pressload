import NextAuth, { type DefaultSession } from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { z } from 'zod'
import bcryptjs from 'bcryptjs'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      role?: string
    } & DefaultSession['user']
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      authorize: async (credentials) => {
        const parsed = z.object({
          email: z.string().email(),
          password: z.string().min(1),
        }).safeParse(credentials)

        if (!parsed.success) return null

        const { email, password } = parsed.data

        // Dynamic import to avoid DB connection at module load
        const { db } = await import('@/lib/db')
        const { users } = await import('@/lib/db/schema')
        const { eq } = await import('drizzle-orm')

        const user = await db.query.users.findFirst({
          where: eq(users.userEmail, email),
        })

        if (!user) return null

        const valid = await bcryptjs.compare(password, user.userPass)
        if (!valid) return null

        return {
          id: user.id,
          email: user.userEmail,
          name: user.displayName,
        }
      },
    }),
  ],
  pages: {
    signIn: '/signin',
  },
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id
      }
      return token
    },
    session({ session, token }) {
      if (token.id) {
        session.user.id = token.id as string
      }
      return session
    },
  },
})
