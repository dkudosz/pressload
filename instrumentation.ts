export async function register() {
  // Only run in the Node.js runtime (not Edge), and only server-side
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    try {
      const { initializePlugins } = await import('./lib/plugins/loader')
      await initializePlugins()
    } catch {
      // Don't crash startup if plugin initialization fails (e.g. no DB yet)
    }
  }
}
