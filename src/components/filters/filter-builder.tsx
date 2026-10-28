import { useState } from 'react'
import type { FilterCondition, FilterField } from '@/lib/api/types'
import { operatorLabel } from '@/lib/pagination'
import { Button } from '@/components/ui/button'

type Draft = {
  column: string
  op: string
  raw: string
}

function emptyDraft(fields: FilterField[]): Draft {
  const field = fields.find((item) => item.default) ?? fields[0]
  return { column: field?.value ?? '', op: field?.operators[0] ?? 'eq', raw: '' }
}

function toCondition(field: FilterField, draft: Draft): FilterCondition | null {
  const raw = draft.raw.trim()
  if (!raw) return null

  if (draft.op === 'in') {
    const parts = raw.split(',').map((part) => part.trim()).filter(Boolean)
    if (parts.length === 0) return null
    if (field.type === 'number') {
      const numbers = parts.map((part) => Number(part))
      if (numbers.some((value) => !Number.isInteger(value))) return null
      return { column: draft.column, op: draft.op, value: numbers }
    }
    return { column: draft.column, op: draft.op, value: parts }
  }

  if (field.type === 'number') {
    const value = Number(raw)
    if (!Number.isInteger(value)) return null
    return { column: draft.column, op: draft.op, value }
  }

  if (field.type === 'datetime') {
    const date = new Date(raw)
    if (Number.isNaN(date.getTime())) return null
    return { column: draft.column, op: draft.op, value: date.toISOString() }
  }

  return { column: draft.column, op: draft.op, value: raw }
}

export function FilterBuilder({
  fields,
  onChange,
}: {
  fields: FilterField[]
  onChange: (conditions: FilterCondition[]) => void
}) {
  const [drafts, setDrafts] = useState<Draft[]>([])
  if (fields.length === 0) return null

  function publish(next: Draft[]) {
    setDrafts(next)
    const conditions = next.flatMap((draft) => {
      const field = fields.find((item) => item.value === draft.column)
      if (!field) return []
      const condition = toCondition(field, draft)
      return condition ? [condition] : []
    })
    onChange(conditions)
  }

  return (
    <fieldset className="mt-4 flex flex-col gap-3">
      <legend className="text-[11px] font-medium tracking-[0.16em] text-mist uppercase">Filtros adicionais</legend>
      {drafts.map((draft, index) => {
        const field = fields.find((item) => item.value === draft.column) ?? fields[0]
        if (!field) return null
        const useOptions = field.options.length > 0 && (draft.op === 'eq' || draft.op === 'ne')
        return (
          <div key={`${draft.column}-${index}`} className="grid min-w-0 gap-2 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,1.4fr)_auto]">
            <select
              aria-label={`Campo do filtro ${index + 1}`}
              className="w-full min-w-0 max-w-full rounded-lg border border-line bg-foam px-3 py-2 text-sm"
              value={draft.column}
              onChange={(event) => {
                const nextField = fields.find((item) => item.value === event.target.value) ?? fields[0]
                const next = drafts.map((item, itemIndex) =>
                  itemIndex === index
                    ? { column: nextField.value, op: nextField.operators[0] ?? 'eq', raw: '' }
                    : item,
                )
                publish(next)
              }}
            >
              {fields.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.name}
                </option>
              ))}
            </select>
            <select
              aria-label={`Operador do filtro ${index + 1}`}
              className="w-full min-w-0 max-w-full rounded-lg border border-line bg-foam px-3 py-2 text-sm"
              value={draft.op}
              onChange={(event) => {
                const next = drafts.map((item, itemIndex) =>
                  itemIndex === index ? { ...item, op: event.target.value, raw: '' } : item,
                )
                publish(next)
              }}
            >
              {field.operators.map((operator) => (
                <option key={operator} value={operator}>
                  {operatorLabel(operator)}
                </option>
              ))}
            </select>
            {useOptions ? (
              <select
                aria-label={`Valor do filtro ${index + 1}`}
                className="w-full min-w-0 max-w-full rounded-lg border border-line bg-foam px-3 py-2 text-sm"
                value={draft.raw}
                onChange={(event) => {
                  const next = drafts.map((item, itemIndex) =>
                    itemIndex === index ? { ...item, raw: event.target.value } : item,
                  )
                  publish(next)
                }}
              >
                <option value="">Selecione</option>
                {field.options.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.name}
                  </option>
                ))}
              </select>
            ) : (
              <input
                aria-label={`Valor do filtro ${index + 1}`}
                className="w-full min-w-0 max-w-full rounded-lg border border-line bg-foam px-3 py-2 text-sm"
                type={field.type === 'datetime' ? 'datetime-local' : field.type === 'number' ? 'number' : 'text'}
                value={draft.raw}
                placeholder={draft.op === 'in' ? 'Separe por vírgula' : ''}
                onChange={(event) => {
                  const next = drafts.map((item, itemIndex) =>
                    itemIndex === index ? { ...item, raw: event.target.value } : item,
                  )
                  publish(next)
                }}
              />
            )}
            <Button
              type="button"
              variant="quiet"
              onClick={() => publish(drafts.filter((_, itemIndex) => itemIndex !== index))}
            >
              Remover
            </Button>
          </div>
        )
      })}
      {drafts.length < 4 ? (
        <div>
          <Button type="button" variant="quiet" onClick={() => publish([...drafts, emptyDraft(fields)])}>
            Adicionar filtro
          </Button>
        </div>
      ) : null}
    </fieldset>
  )
}
