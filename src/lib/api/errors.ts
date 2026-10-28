export type ApiErrorKind =
  | 'network'
  | 'timeout'
  | 'unauthorized'
  | 'forbidden'
  | 'validation'
  | 'not_found'
  | 'server'
  | 'parse'

export class ApiError extends Error {
  readonly status: number
  readonly kind: ApiErrorKind
  readonly fieldErrors: Record<string, string>

  constructor(
    message: string,
    options: { status?: number; kind: ApiErrorKind; fieldErrors?: Record<string, string> },
  ) {
    super(message)
    this.name = 'ApiError'
    this.status = options.status ?? 0
    this.kind = options.kind
    this.fieldErrors = options.fieldErrors ?? {}
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError
}

type ValidationIssue = {
  loc?: Array<string | number>
  msg?: string
}

export function fieldErrorsFromDetail(detail: unknown): Record<string, string> {
  if (!Array.isArray(detail)) return {}

  const errors: Record<string, string> = {}
  for (const issue of detail as ValidationIssue[]) {
    if (!issue || typeof issue.msg !== 'string') continue
    const loc = Array.isArray(issue.loc) ? issue.loc : []
    const field = [...loc].reverse().find((part) => typeof part === 'string' && part !== 'body')
    if (typeof field === 'string') errors[field] = issue.msg
  }
  return errors
}
