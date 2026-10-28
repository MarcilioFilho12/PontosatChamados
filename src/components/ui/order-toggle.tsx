import { Icon } from '@/components/ui/icon'
import type { SortOrder } from '@/lib/order'

export function OrderToggle({ order, onToggle }: { order: SortOrder; onToggle: () => void }) {
  const rising = order === 'asc'
  return (
    <button
      type="button"
      className="grid h-11 w-11 place-items-center rounded-lg bg-foam text-ink ring-1 ring-line"
      aria-pressed={rising}
      aria-label={rising ? 'Ordem crescente. Mudar para decrescente.' : 'Ordem decrescente. Mudar para crescente.'}
      onClick={onToggle}
    >
      <Icon name={rising ? 'arrow-up' : 'arrow-down'} className="h-4 w-4" />
    </button>
  )
}
