import { useEffect, useId, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Button } from '@/components/ui/button'

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  pending,
  pendingLabel = 'Excluindo…',
  confirmVariant = 'danger',
  onConfirm,
  onClose,
}: {
  open: boolean
  title: string
  description: string
  confirmLabel: string
  pending?: boolean
  pendingLabel?: string
  confirmVariant?: 'primary' | 'danger'
  onConfirm: () => void
  onClose: () => void
}) {
  const titleId = useId()

  useEffect(() => {
    if (!open) return
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape' && !pending) onClose()
    }
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = previous
      window.removeEventListener('keydown', onKey)
    }
  }, [onClose, open, pending])

  if (!open) return null

  return createPortal(
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-ink/40 p-4"
      onClick={() => {
        if (!pending) onClose()
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="w-full max-w-lg rounded-2xl bg-foam p-6 shadow-card"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id={titleId} className="text-xl font-semibold text-ink">
          {title}
        </h2>
        <p className="mt-3 text-sm leading-6 text-mist">{description}</p>
        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <Button type="button" variant="quiet" disabled={pending} onClick={onClose}>
            Cancelar
          </Button>
          <Button type="button" variant={confirmVariant} disabled={pending} onClick={onConfirm}>
            {pending ? pendingLabel : confirmLabel}
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  )
}

export function Bezel({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={`min-w-0 max-w-full rounded-xl border border-line bg-foam shadow-card ${className ?? ''}`}>{children}</div>
  )
}
