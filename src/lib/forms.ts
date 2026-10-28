import { isApiError } from '@/lib/api/errors'
import type { FieldPath, FieldValues, UseFormSetError } from 'react-hook-form'

export function applyApiErrors<T extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<T>,
  setFormError: (message: string) => void,
): void {
  if (!isApiError(error)) {
    setFormError('Não foi possível concluir a operação.')
    return
  }

  const entries = Object.entries(error.fieldErrors)
  for (const [field, message] of entries) {
    setError(field as FieldPath<T>, { message })
  }
  if (entries.length === 0) setFormError(error.message)
}

export function errorMessage(error: unknown): string {
  if (isApiError(error)) return error.message
  return 'Não foi possível concluir a operação.'
}
