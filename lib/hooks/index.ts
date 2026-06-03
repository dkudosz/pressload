type Callback = (...args: unknown[]) => unknown

interface HookEntry {
  callback: Callback
  priority: number
}

export class HookSystem {
  private actions = new Map<string, HookEntry[]>()
  private filters = new Map<string, HookEntry[]>()

  private sorted(map: Map<string, HookEntry[]>, hook: string): HookEntry[] {
    return (map.get(hook) ?? []).slice().sort((a, b) => a.priority - b.priority)
  }

  addAction(hook: string, callback: Callback, priority = 10): void {
    const list = this.actions.get(hook) ?? []
    list.push({ callback, priority })
    this.actions.set(hook, list)
  }

  addFilter(hook: string, callback: Callback, priority = 10): void {
    const list = this.filters.get(hook) ?? []
    list.push({ callback, priority })
    this.filters.set(hook, list)
  }

  removeAction(hook: string, callback: Callback): void {
    const list = this.actions.get(hook)
    if (list) this.actions.set(hook, list.filter((e) => e.callback !== callback))
  }

  removeFilter(hook: string, callback: Callback): void {
    const list = this.filters.get(hook)
    if (list) this.filters.set(hook, list.filter((e) => e.callback !== callback))
  }

  doAction(hook: string, ...args: unknown[]): void {
    for (const { callback } of this.sorted(this.actions, hook)) {
      callback(...args)
    }
  }

  applyFilters<T>(hook: string, value: T, ...args: unknown[]): T {
    let result = value
    for (const { callback } of this.sorted(this.filters, hook)) {
      result = callback(result, ...args) as T
    }
    return result
  }

  hasAction(hook: string): boolean {
    return (this.actions.get(hook)?.length ?? 0) > 0
  }

  hasFilter(hook: string): boolean {
    return (this.filters.get(hook)?.length ?? 0) > 0
  }
}

// Module-level singleton — lives for the lifetime of the Node.js process
export const hooks = new HookSystem()

export const addAction = hooks.addAction.bind(hooks)
export const addFilter = hooks.addFilter.bind(hooks)
export const removeAction = hooks.removeAction.bind(hooks)
export const removeFilter = hooks.removeFilter.bind(hooks)
export const doAction = hooks.doAction.bind(hooks)
export const applyFilters = hooks.applyFilters.bind(hooks)
