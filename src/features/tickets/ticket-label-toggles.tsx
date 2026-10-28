import { labelName, ticketLabels, type TicketLabel } from '@/features/tickets/labels'

const tone: Record<TicketLabel, string> = {
  urgencia: 'bg-warning-ink text-white',
  complexo: 'bg-ink text-foam',
  simples: 'bg-success-soft text-success-ink',
}

export function TicketLabelToggles({
  ticketId,
  selected,
  onToggle,
}: {
  ticketId: number
  selected: TicketLabel[]
  onToggle: (id: number, label: TicketLabel) => void
}) {
  return (
    <div className="flex flex-wrap gap-1.5" role="group" aria-label={`Etiquetas do chamado ${ticketId}`}>
      {ticketLabels.map((label) => {
        const active = selected.includes(label)
        return (
          <button
            key={label}
            type="button"
            aria-pressed={active}
            className={`rounded-full px-2.5 py-1 text-xs font-medium ${active ? tone[label] : 'bg-foam text-mist ring-1 ring-line'}`}
            onClick={() => onToggle(ticketId, label)}
          >
            {labelName(label)}
          </button>
        )
      })}
    </div>
  )
}
