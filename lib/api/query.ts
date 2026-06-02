export interface QueryParams {
  page: number
  perPage: number
  fields: string[] | null
  sort: string
  order: 'asc' | 'desc'
  status: string | null
  search: string | null
}

export function parseQueryParams(searchParams: URLSearchParams): QueryParams {
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10) || 1)
  const perPage = Math.min(
    100,
    Math.max(1, parseInt(searchParams.get('per_page') ?? '10', 10) || 10),
  )
  const fieldsStr = searchParams.get('fields')
  const fields = fieldsStr
    ? fieldsStr.split(',').map((f) => f.trim()).filter(Boolean)
    : null
  const sort = searchParams.get('sort') ?? 'date'
  const order = searchParams.get('order') === 'asc' ? 'asc' : 'desc'
  const status = searchParams.get('status') ?? null
  const search = searchParams.get('search') ?? null

  return { page, perPage, fields, sort, order, status, search }
}

export function selectFields<T extends Record<string, unknown>>(
  obj: T,
  fields: string[] | null,
): Partial<T> {
  if (!fields || fields.length === 0) return obj
  const result: Partial<T> = {}
  for (const field of fields) {
    if (field in obj) result[field as keyof T] = obj[field as keyof T]
  }
  return result
}
