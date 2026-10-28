import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Bezel } from '@/components/ui/surface'
import { FormAlert } from '@/components/feedback/states'
import { PageIntro } from '@/components/layout/page-intro'
import { TicketFields } from '@/features/tickets/ticket-fields'
import { createTicket } from '@/lib/api/resources'
import { applyApiErrors } from '@/lib/forms'
import { ticketFormSchema, type TicketFormValues } from '@/lib/validation/schemas'

export function TicketCreatePage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [formError, setFormError] = useState<string | null>(null)
  const form = useForm<TicketFormValues>({
    resolver: zodResolver(ticketFormSchema),
    defaultValues: { title: '', description: '', status: 'open' },
  })
  const mutation = useMutation({
    mutationFn: createTicket,
    onSuccess: async (ticket) => {
      await queryClient.invalidateQueries({ queryKey: ['tickets'] })
      navigate(`/chamados/${ticket.id}`)
    },
  })

  return (
    <>
      <PageIntro eyebrow="Novo chamado" title="Abrir solicitação">
        <Link to="/" className="text-sm text-mist">
          Voltar aos chamados
        </Link>
      </PageIntro>
      <Bezel>
        <form
          className="flex flex-col gap-5 px-6 py-7"
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
          <Button type="submit" icon="plus" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? 'Abrindo…' : 'Abrir chamado'}
          </Button>
        </form>
      </Bezel>
    </>
  )
}
