import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Bezel, ConfirmDialog } from '@/components/ui/surface'
import { StatusBadge } from '@/components/ui/status-badge'
import { ErrorBlock, FormAlert, LoadingBlock, StatusNote } from '@/components/feedback/states'
import { Thread } from '@/features/interactions/thread'
import { useTicketLabels } from '@/features/tickets/labels'
import { TicketLabelToggles } from '@/features/tickets/ticket-label-toggles'
import { TicketFields } from '@/features/tickets/ticket-fields'
import { usePersonName } from '@/features/tickets/use-person-name'
import { deleteTicket, getTicket, updateTicket } from '@/lib/api/resources'
import { formatDateTime } from '@/lib/format'
import { applyApiErrors, errorMessage } from '@/lib/forms'
import { ticketFormSchema, type TicketFormValues } from '@/lib/validation/schemas'

export function TicketDetailPage() {
  const params = useParams()
  const ticketId = Number(params.ticketId)
  const valid = Number.isInteger(ticketId) && ticketId >= 1
  const personName = usePersonName()
  const ticketTags = useTicketLabels()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [editing, setEditing] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [note, setNote] = useState<string | null>(null)

  const ticket = useQuery({
    queryKey: ['tickets', 'one', ticketId],
    queryFn: () => getTicket(ticketId),
    enabled: valid,
  })

  const remove = useMutation({
    mutationFn: () => deleteTicket(ticketId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['tickets'] })
      navigate('/', { replace: true })
    },
  })

  if (!valid) return <ErrorBlock message="Chamado não encontrado." />
  if (ticket.isPending) return <LoadingBlock label="Carregando chamado…" />
  if (ticket.isError) return <ErrorBlock message={errorMessage(ticket.error)} onRetry={() => void ticket.refetch()} />

  const current = ticket.data

  return (
    <>
    <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
      <div className="order-2 lg:order-1">
        <Thread ticketId={current.id} />
      </div>
      <div className="order-1 lg:order-2">
        <Link to="/" className="text-sm text-mist">
          Voltar aos chamados
        </Link>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <StatusBadge status={current.status} />
          <TicketLabelToggles
            ticketId={current.id}
            selected={ticketTags.labels[current.id] ?? []}
            onToggle={ticketTags.toggle}
          />
        </div>
        <p className="mt-2 text-xs text-mist">As etiquetas ficam só neste navegador.</p>
        <h1 className="mt-4 font-display text-3xl leading-[0.95] break-words sm:text-4xl lg:text-5xl">{current.title}</h1>
        <p className="mt-4 text-sm leading-7 break-words whitespace-pre-wrap text-ink">{current.description}</p>
        <dl className="mt-6 grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-mist">Aberto por</dt>
            <dd className="mt-1">{personName(current.id_user)}</dd>
          </div>
          <div>
            <dt className="text-mist">Atualizado</dt>
            <dd className="mt-1">{formatDateTime(current.date_updated)}</dd>
          </div>
          <div>
            <dt className="text-mist">Criado</dt>
            <dd className="mt-1">{formatDateTime(current.date_created)}</dd>
          </div>
        </dl>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button type="button" variant="quiet" onClick={() => setEditing((value) => !value)}>
            {editing ? 'Fechar edição' : 'Editar chamado'}
          </Button>
          <Button type="button" variant="danger" onClick={() => setConfirmDelete(true)}>
            Excluir chamado
          </Button>
        </div>
        <StatusNote message={note} />
        {editing ? (
          <div className="mt-6">
            <Bezel>
              <EditTicket
                ticketId={current.id}
                initial={{ title: current.title, description: current.description, status: current.status }}
                onSaved={() => {
                  setEditing(false)
                  setNote('Chamado atualizado.')
                }}
              />
            </Bezel>
          </div>
        ) : null}
      </div>
    </div>
    <ConfirmDialog
        open={confirmDelete}
        title="Excluir chamado?"
        description="O chamado e todas as mensagens serão excluídos."
        confirmLabel="Excluir chamado"
        pending={remove.isPending}
        onClose={() => setConfirmDelete(false)}
        onConfirm={() => {
          remove.mutate(undefined, {
            onError: () => setConfirmDelete(false),
          })
        }}
      />
      {remove.isError ? <p className="mt-4 text-sm text-clay">{errorMessage(remove.error)}</p> : null}
    </>
  )
}

function EditTicket({
  ticketId,
  initial,
  onSaved,
}: {
  ticketId: number
  initial: TicketFormValues
  onSaved: () => void
}) {
  const queryClient = useQueryClient()
  const [formError, setFormError] = useState<string | null>(null)
  const form = useForm<TicketFormValues>({
    resolver: zodResolver(ticketFormSchema),
    defaultValues: initial,
  })
  const mutation = useMutation({
    mutationFn: (values: TicketFormValues) => updateTicket(ticketId, values),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['tickets'] })
      onSaved()
    },
  })

  return (
    <form
      className="flex flex-col gap-5 px-5 py-6"
      noValidate
      onSubmit={form.handleSubmit(async (values) => {
        setFormError(null)
        try {
          await mutation.mutateAsync(values)
        } catch (error) {
          applyApiErrors(error, form.setError, setFormError)
        }
      })}
    >
      <FormAlert message={formError} />
      <TicketFields form={form} />
      <Button type="submit" disabled={form.formState.isSubmitting}>
        {form.formState.isSubmitting ? 'Salvando…' : 'Salvar alterações'}
      </Button>
    </form>
  )
}
