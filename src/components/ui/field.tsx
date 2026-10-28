import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react'

const control =
  'w-full min-w-0 max-w-full rounded-lg border border-line bg-foam px-3.5 py-2.5 text-base text-ink outline-none placeholder:text-mist sm:text-sm'

export function Field({
  label,
  htmlFor,
  error,
  hint,
  children,
}: {
  label: string
  htmlFor: string
  error?: string
  hint?: string
  children: ReactNode
}) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={htmlFor} className="text-sm font-medium text-ink">
        {label}
      </label>
      {children}
      {error ? (
        <p id={`${htmlFor}-erro`} className="text-sm text-clay" role="alert">
          {error}
        </p>
      ) : null}
      {hint && !error ? (
        <p id={`${htmlFor}-dica`} className="text-xs text-mist">
          {hint}
        </p>
      ) : null}
    </div>
  )
}

export function TextInput({
  id,
  invalid,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }) {
  return (
    <input
      id={id}
      aria-invalid={invalid ? true : undefined}
      aria-describedby={invalid ? `${id}-erro` : undefined}
      className={control}
      {...props}
    />
  )
}

export function TextArea({
  id,
  invalid,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean }) {
  return (
    <textarea
      id={id}
      aria-invalid={invalid ? true : undefined}
      aria-describedby={invalid ? `${id}-erro` : undefined}
      className={`${control} min-h-32 resize-y`}
      {...props}
    />
  )
}

export function SelectInput({
  id,
  invalid,
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & { invalid?: boolean }) {
  return (
    <select
      id={id}
      aria-invalid={invalid ? true : undefined}
      aria-describedby={invalid ? `${id}-erro` : undefined}
      className={control}
      {...props}
    >
      {children}
    </select>
  )
}
