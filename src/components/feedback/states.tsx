import type { ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Bezel } from '@/components/ui/surface'

export function LoadingBlock({ label }: { label: string }) {
  return (
    <Bezel>
      <div className="space-y-4 px-6 py-8" role="status" aria-live="polite">
        <p className="text-sm text-mist">{label}</p>
        <div className="soft-pulse h-4 w-2/3 rounded-full bg-ink/10" />
        <div className="soft-pulse h-4 w-1/2 rounded-full bg-ink/10" />
        <div className="soft-pulse h-4 w-3/5 rounded-full bg-ink/10" />
      </div>
    </Bezel>
  )
}

export function EmptyBlock({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Bezel>
      <div className="px-6 py-12">
        <h2 className="text-xl font-semibold">{title}</h2>
        <p className="mt-3 max-w-md text-sm leading-6 text-mist">{children}</p>
      </div>
    </Bezel>
  )
}

export function ErrorBlock({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <Bezel>
      <div className="px-6 py-8" role="alert">
        <h2 className="text-xl font-semibold">Não foi possível carregar</h2>
        <p className="mt-3 text-sm leading-6 text-mist">{message}</p>
        {onRetry ? (
          <div className="mt-6">
            <Button type="button" variant="quiet" onClick={onRetry}>
              Tentar de novo
            </Button>
          </div>
        ) : null}
      </div>
    </Bezel>
  )
}

export function FormAlert({ message }: { message: string | null }) {
  if (!message) return null
  return (
    <p role="alert" className="rounded-lg bg-danger-soft px-4 py-3 text-sm text-clay">
      {message}
    </p>
  )
}

export function StatusNote({ message }: { message: string | null }) {
  if (!message) return null
  return (
    <p role="status" className="text-sm text-success-ink">
      {message}
    </p>
  )
}
