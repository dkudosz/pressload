import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

// Postgres connects lazily on first query — don't throw at module load so
// the Next.js build can import this module without DATABASE_URL being set.
const connectionString = process.env.DATABASE_URL ?? 'postgresql://localhost/pressload'

const client = postgres(connectionString)
export const db = drizzle(client, { schema })
