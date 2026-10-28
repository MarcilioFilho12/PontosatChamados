import type { TicketStatus } from '@/lib/api/types'
import { statusLabel } from '@/lib/format'

const tone: Record<TicketStatus, string> = {
  open: 'bg-warning-ink text-white',
  in_progress: 'bg-brand-soft text-moss',
  closed: 'bg-success-soft text-success-ink',
}

export function StatusBadge({ status }: { status: TicketStatus }) {
  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-[11px] font-medium tracking-[0.14em] uppercase ${tone[status]}`}>
      {statusLabel(status)}
    </span>
  )
}
