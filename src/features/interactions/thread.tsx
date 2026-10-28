import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useAuth } from '@/app/auth-context'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/surface'
import { Field, TextArea } from '@/components/ui/field'
import { FormAlert, StatusNote } from '@/components/feedback/states'
import { createInteraction, deleteInteraction, listThread, updateInteraction } from '@/lib/api/resources'
import { formatDateTime } from '@/lib/format'
import { errorMessage } from '@/lib/forms'
import { usePersonName } from '@/features/tickets/use-person-name'

export function Thread({ ticketId }: { ticketId: number }) {
  const { user } = useAuth()
  const personName = usePersonName()
  const queryClient = useQueryClient()
  const [text, setText] = useState('')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editText, setEditText] = useState('')
  const [pendingDelete, setPendingDelete] = useState<number | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [note, setNote] = useState<string | null>(null)

  const thread = useQuery({
    queryKey: ['interactions', ticketId],
    queryFn: () => listThread(ticketId),
  })

  const create = useMutation({
    mutationFn: createInteraction,
    onSuccess: async () => {
      setText('')
      setNote('Mensagem publicada.')
      await queryClient.invalidateQueries({ queryKey: ['interactions', ticketId] })
    },
  })
  const update = useMutation({
    mutationFn: ({ id, value }: { id: number; value: string }) => updateInteraction(id, value),
    onSuccess: async () => {
      setEditingId(null)
      setNote('Mensagem atualizada.')
      await queryClient.invalidateQueries({ queryKey: ['interactions', ticketId] })
    },
  })
  const remove = useMutation({
    mutationFn: deleteInteraction,
    onSuccess: async () => {
      setPendingDelete(null)
      setNote('Mensagem excluída.')
      await queryClient.invalidateQueries({ queryKey: ['interactions', ticketId] })
    },
  })

  return (
    <section aria-labelledby="conversa-titulo">
      <h2 id="conversa-titulo" className="font-display text-3xl sm:text-4xl">
        Conversa
      </h2>
      {thread.isPending ? <p className="mt-4 text-sm text-mist">Carregando mensagens…</p> : null}
      {thread.isError ? <p className="mt-4 text-sm text-clay">{errorMessage(thread.error)}</p> : null}
      {thread.data ? (
        <>
          {thread.data.total > thread.data.items.length ? (
            <p className="mt-3 text-sm text-mist">
              Há {thread.data.total} mensagens. Este painel mostra as primeiras {thread.data.items.length} retornadas pela API.
            </p>
          ) : null}
          {thread.data.items.length === 0 ? (
            <p className="mt-4 text-sm text-mist">Nenhuma mensagem ainda. A conversa começa abaixo.</p>
          ) : (
            <ol className="mt-6 flex flex-col gap-4" aria-label="Mensagens do chamado">
              {thread.data.items.map((item) => {
                const mine = user?.id === item.id_user
                const canChange = mine || user?.role === 'admin'
                return (
                  <li key={item.id} className="rounded-[1.5rem] bg-paper px-4 py-4">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <p className="text-sm font-medium">{personName(item.id_user)}</p>
                      <time className="text-xs text-mist" dateTime={item.created_at}>
                        {formatDateTime(item.created_at)}
                      </time>
                    </div>
                    {editingId === item.id ? (
                      <form
                        className="mt-3 flex flex-col gap-3"
                        onSubmit={(event) => {
                          event.preventDefault()
                          if (editText.trim().length === 0 || update.isPending) return
                          setFormError(null)
                          update.mutate(
                            { id: item.id, value: editText.trim() },
                            { onError: (mutationError) => setFormError(errorMessage(mutationError)) },
                          )
                        }}
                      >
                        <TextArea
                          id={`editar-${item.id}`}
                          aria-label="Editar mensagem"
                          value={editText}
                          onChange={(event) => setEditText(event.target.value)}
                        />
                        <div className="flex gap-2">
                          <Button type="submit" disabled={update.isPending || editText.trim().length === 0}>
                            Salvar
                          </Button>
                          <Button type="button" variant="quiet" onClick={() => setEditingId(null)}>
                            Cancelar
                          </Button>
                        </div>
                      </form>
                    ) : (
                      <p className="mt-3 text-sm leading-6 break-words whitespace-pre-wrap">{item.text}</p>
                    )}
                    {canChange && editingId !== item.id ? (
                      <div className="mt-3 flex gap-2">
                        <Button
                          type="button"
                          variant="quiet"
                          onClick={() => {
                            setEditingId(item.id)
                            setEditText(item.text)
                          }}
                        >
                          Editar
                        </Button>
                        <Button type="button" variant="danger" onClick={() => setPendingDelete(item.id)}>
                          Excluir
                        </Button>
                      </div>
                    ) : null}
                  </li>
                )
              })}
            </ol>
          )}
        </>
      ) : null}
      <form
        className="mt-6 flex flex-col gap-3"
        onSubmit={(event) => {
          event.preventDefault()
          if (text.trim().length === 0 || create.isPending) return
          setFormError(null)
          setNote(null)
          create.mutate(
            { text: text.trim(), id_ticket: ticketId },
            { onError: (mutationError) => setFormError(errorMessage(mutationError)) },
          )
        }}
      >
        <Field label="Mensagem" htmlFor="mensagem" hint="Ctrl + Enter também envia.">
          <TextArea
            id="mensagem"
            value={text}
            invalid={false}
            onChange={(event) => setText(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
                event.currentTarget.form?.requestSubmit()
              }
            }}
          />
        </Field>
        <FormAlert message={formError} />
        <StatusNote message={note} />
        <Button type="submit" icon="arrow" disabled={create.isPending || text.trim().length === 0}>
          {create.isPending ? 'Enviando…' : 'Publicar'}
        </Button>
      </form>
      <ConfirmDialog
        open={pendingDelete !== null}
        title="Excluir mensagem?"
        description="A mensagem sai da conversa deste chamado."
        confirmLabel="Excluir mensagem"
        pending={remove.isPending}
        onClose={() => setPendingDelete(null)}
        onConfirm={() => {
          if (pendingDelete === null) return
          remove.mutate(pendingDelete, {
            onError: (mutationError) => {
              setPendingDelete(null)
              setFormError(errorMessage(mutationError))
            },
          })
        }}
      />
    </section>
  )
}
