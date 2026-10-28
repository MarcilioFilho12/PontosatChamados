import { z } from 'zod'
import { ApiError, fieldErrorsFromDetail } from '@/lib/api/errors'
import { clearSession, readSession } from '@/lib/api/session'

const DOCUMENTED_API = 'http://api-segunda-fase.pontosat.net.br:18137'
const TIMEOUT_MS = 15_000
export const UNAUTHORIZED_EVENT = 'pontosat:unauthorized'

const envelopeSchema = z.object({
  type: z.enum(['success', 'error']),
  message: z.string().optional().default(''),
  data: z.unknown().optional(),
  meta: z.object({ total: z.number() }).nullable().optional(),
})

export type ApiResult = {
  data: unknown
  message: string
  total: number | null
}

type QueryValue = string | number | undefined

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  body?: unknown
  query?: Record<string, QueryValue>
  signal?: AbortSignal
  auth?: boolean
}

export function apiBaseUrl(): string {
  const configured = import.meta.env.VITE_API_BASE_URL?.trim()
  const base = configured && configured.length > 0 ? configured : DOCUMENTED_API
  return base.replace(/\/$/, '')
}

export function onUnauthorized(listener: () => void): () => void {
  window.addEventListener(UNAUTHORIZED_EVENT, listener)
  return () => window.removeEventListener(UNAUTHORIZED_EVENT, listener)
}

function kindFromStatus(status: number): ApiError['kind'] {
  if (status === 401) return 'unauthorized'
  if (status === 403) return 'forbidden'
  if (status === 404) return 'not_found'
  if (status === 422) return 'validation'
  return 'server'
}

function safeMessage(message: string, fallback: string): string {
  if (/traceback|exception|sql syntax|stack trace|\/var\/|\/home\//i.test(message)) return fallback
  const clean = message.trim()
  return clean.length > 0 ? clean : fallback
}

function messageFromBody(body: unknown, status: number): { message: string; fieldErrors: Record<string, string> } {
  const fallback = 'Não foi possível concluir a operação.'
  if (!body || typeof body !== 'object') return { message: fallback, fieldErrors: {} }

  const record = body as Record<string, unknown>
  if (typeof record.detail === 'string') {
    return { message: safeMessage(record.detail, fallback), fieldErrors: {} }
  }

  const fieldErrors = fieldErrorsFromDetail(record.detail)
  if (typeof record.message === 'string') {
    return { message: safeMessage(record.message, fallback), fieldErrors }
  }

  const first = Object.values(fieldErrors)[0]
  return { message: first ? safeMessage(first, fallback) : `${fallback} (${status})`, fieldErrors }
}

function buildUrl(path: string, query?: Record<string, QueryValue>): string {
  const url = new URL(`${apiBaseUrl()}${path}`)
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined || value === '') continue
      url.searchParams.set(key, String(value))
    }
  }
  return url.toString()
}

export async function apiRequest(path: string, options: RequestOptions = {}): Promise<ApiResult> {
  const controller = new AbortController()
  const timeout = window.setTimeout(() => controller.abort(), TIMEOUT_MS)
  const signal = options.signal ? AbortSignal.any([options.signal, controller.signal]) : controller.signal
  const auth = options.auth !== false
  const headers = new Headers({ Accept: 'application/json' })

  if (options.body !== undefined) headers.set('Content-Type', 'application/json')
  if (auth) {
    const session = readSession()
    if (!session) {
      window.clearTimeout(timeout)
      throw new ApiError('Sua sessão expirou. Entre novamente.', { kind: 'unauthorized', status: 401 })
    }
    headers.set('Authorization', `Bearer ${session.accessToken}`)
  }

  let response: Response
  try {
    response = await fetch(buildUrl(path, options.query), {
      method: options.method ?? 'GET',
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      signal,
      cache: 'no-store',
      credentials: 'omit',
      referrerPolicy: 'no-referrer',
    })
  } catch (error) {
    if (controller.signal.aborted) {
      throw new ApiError('A API demorou demais para responder.', { kind: 'timeout' })
    }
    if (error instanceof DOMException && error.name === 'AbortError') throw error
    throw new ApiError('Não foi possível conectar à API.', { kind: 'network' })
  } finally {
    window.clearTimeout(timeout)
  }

  const text = await response.text()
  let body: unknown = null
  if (text.length > 0) {
    try {
      body = JSON.parse(text) as unknown
    } catch {
      throw new ApiError('A API retornou um formato inesperado.', { kind: 'parse', status: response.status })
    }
  }

  if (!response.ok) {
    const parsed = messageFromBody(body, response.status)
    if (response.status === 401 && auth) {
      clearSession()
      window.dispatchEvent(new Event(UNAUTHORIZED_EVENT))
    }
    throw new ApiError(parsed.message, {
      status: response.status,
      kind: kindFromStatus(response.status),
      fieldErrors: parsed.fieldErrors,
    })
  }

  const envelope = envelopeSchema.safeParse(body)
  if (!envelope.success) {
    throw new ApiError('A API retornou um formato inesperado.', { kind: 'parse', status: response.status })
  }
  if (envelope.data.type === 'error') {
    throw new ApiError(safeMessage(envelope.data.message, 'Não foi possível concluir a operação.'), {
      kind: 'server',
      status: response.status,
    })
  }

  return {
    data: envelope.data.data,
    message: envelope.data.message,
    total: envelope.data.meta?.total ?? null,
  }
}
