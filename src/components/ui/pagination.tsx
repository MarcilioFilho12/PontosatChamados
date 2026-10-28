import { pageCount } from '@/lib/pagination'
import { Button } from '@/components/ui/button'

export function Pagination({
  page,
  total,
  limit,
  onPage,
}: {
  page: number
  total: number
  limit: number
  onPage: (page: number) => void
}) {
  const pages = pageCount(total, limit)
  if (total <= limit) return null

  return (
    <nav className="mt-6 flex flex-wrap items-center justify-between gap-3" aria-label="Paginação">
      <Button type="button" variant="quiet" disabled={page === 0} onClick={() => onPage(page - 1)}>
        Anterior
      </Button>
      <p className="text-sm text-mist">
        Página {page + 1} de {pages}
      </p>
      <Button type="button" variant="quiet" disabled={page + 1 >= pages} onClick={() => onPage(page + 1)}>
        Próxima
      </Button>
    </nav>
  )
}
