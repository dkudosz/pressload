import { NextResponse } from 'next/server'

export function ok<T>(data: T): NextResponse {
  return NextResponse.json({ data })
}

export function created<T>(data: T): NextResponse {
  return NextResponse.json({ data }, { status: 201 })
}

export function noContent(): NextResponse {
  return new NextResponse(null, { status: 204 })
}

export function paginated<T>(
  data: T[],
  meta: { total: number; page: number; per_page: number },
): NextResponse {
  return NextResponse.json({
    data,
    meta: { ...meta, total_pages: Math.ceil(meta.total / meta.per_page) },
  })
}

export function badRequest(error: string): NextResponse {
  return NextResponse.json({ error }, { status: 400 })
}

export function unauthorized(): NextResponse {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}

export function forbidden(): NextResponse {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}

export function notFound(resource = 'Resource'): NextResponse {
  return NextResponse.json({ error: `${resource} not found` }, { status: 404 })
}

export function serverError(msg = 'Internal server error'): NextResponse {
  return NextResponse.json({ error: msg }, { status: 500 })
}
