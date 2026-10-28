import { useQuery } from '@tanstack/react-query'
import { getTicketFilters, listTickets } from '@/lib/api/resources'
import type { FilterField, FilterPayload } from '@/lib/api/types'
import { errorMessage } from '@/lib/forms'

const REFRESH_MS = 60_000
const RECENT_HOURS = 6

type Reading = {
  id: string
  label: string
  detail: string
  enabled: boolean
  pending?: boolean
  filters?: FilterPayload
}

function allows(fields: FilterField[] | undefined, column: string, op: string): boolean {
  const field = fields?.find((item) => item.value === column)
  if (!field) return false
  if (field.operators.length === 0) return true
  return field.operators.includes(op)
}

function since(hours: number): string {
  return new Date(Date.now() - hours * 60 * 60 * 1000).toISOString()
}

async function countTickets(filters: FilterPayload): Promise<number> {
  const page = await listTickets({ offset: 0, limit: 1, filters })
  return page.total
}

function ScoreboardGroup({ readings, hidden = false }: { readings: Reading[]; hidden?: boolean }) {
  return (
    <div className="scoreboard-group" aria-hidden={hidden || undefined}>
          {readings.map((reading) => (
        <ScoreCard key={reading.id} reading={reading} />
          ))}
      </div>
  )
}

function ScoreCard({ reading }: { reading: Reading }) {
  const total = useQuery({
    queryKey: ['tickets', 'pulse', reading.id],
    queryFn: () => {
      if (reading.id === 'hour') {
        return countTickets({ and: [{ column: 'date_created', op: 'gte', value: since(1) }] })
      }
      if (reading.id === 'closed') {
        return countTickets({
          and: [
            { column: 'status', op: 'eq', value: 'closed' },
            { column: 'date_updated', op: 'gte', value: since(RECENT_HOURS) },
          ],
        })
      }
      return countTickets(reading.filters ?? {})
    },
    enabled: reading.enabled && (reading.id === 'hour' || reading.id === 'closed' || Boolean(reading.filters)),
    refetchInterval: REFRESH_MS,
    staleTime: 30_000,
  })
  const value = reading.pending
    ? '…'
    : !reading.enabled
      ? '—'
      : total.isPending || total.data === undefined
        ? '…'
        : String(total.data).padStart(2, '0')

  return (
    <div className="score-card">
      <span className="score-label">{reading.label}</span>
      <span className="score-value">{value}</span>
      <span className="score-detail">{total.isError ? errorMessage(total.error) : reading.detail}</span>
      {total.isError ? (
        <button type="button" className="score-retry" onClick={() => void total.refetch()}>
            Tentar de novo
          </button>
      ) : null}
    </div>
  )
}

export function DeskPulse() {
  const fields = useQuery({
    queryKey: ['tickets', 'filters'],
    queryFn: getTicketFilters,
    staleTime: 5 * 60_000,
  })
  const created = allows(fields.data, 'date_created', 'gte')
  const updated = allows(fields.data, 'date_updated', 'gte')
  const readings: Reading[] = [
    {
      id: 'open',
      label: 'Abertos agora',
      detail: 'na fila',
      enabled: true,
      filters: { and: [{ column: 'status', op: 'eq', value: 'open' }] },
    },
    {
      id: 'progress',
      label: 'Em atendimento',
      detail: 'em curso',
      enabled: true,
      filters: { and: [{ column: 'status', op: 'eq', value: 'in_progress' }] },
    },
    {
      id: 'hour',
      label: 'Última hora',
      detail: fields.isSuccess && !created ? 'sem recorte' : 'novos chamados',
      enabled: created,
      pending: fields.isPending,
    },
    {
      id: 'closed',
      label: `Finalizados em ${RECENT_HOURS}h`,
      detail: fields.isSuccess && !updated ? 'sem recorte' : 'última alteração',
      enabled: updated,
      pending: fields.isPending,
    },
  ]

  return (
    <header className="scoreboard" aria-label="Pulso da fila">
      <div className="scoreboard-topline">
        <div className="scoreboard-brand">
          <span className="live-dot" />
          <span>Pulso da fila</span>
        </div>
        <span className="live-label">Ao vivo</span>
      </div>
      <div className="ticker-mask">
        <div className="ticker-track">
          <ScoreboardGroup readings={readings} />
          <ScoreboardGroup readings={readings} hidden />
        </div>
      </div>
      <div className="scanline" />
    </header>
  )
}
