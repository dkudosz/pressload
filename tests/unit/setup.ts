// Global test setup — mock Next.js server APIs that aren't available in bare Node
import { vi } from 'vitest'

// next/cache — revalidatePath / revalidateTag are no-ops in tests
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}))

// next/navigation — redirect throws in real code; make it a spy in tests
vi.mock('next/navigation', () => ({
  redirect: vi.fn((url: string) => { throw new Error(`NEXT_REDIRECT:${url}`) }),
  notFound: vi.fn(() => { throw new Error('NEXT_NOT_FOUND') }),
}))

// next/headers — headers() returns an empty map
vi.mock('next/headers', () => ({
  headers: vi.fn(() => new Map()),
  cookies: vi.fn(() => new Map()),
}))
