import type { UseFormReturn } from 'react-hook-form'
import { Field, SelectInput, TextArea, TextInput } from '@/components/ui/field'
import { ticketStatuses, type TicketStatus } from '@/lib/api/types'
import { statusLabel } from '@/lib/format'
import type { TicketFormValues } from '@/lib/validation/schemas'

export function TicketFields({ form }: { form: UseFormReturn<TicketFormValues> }) {
  return (
    <>
      <Field label="Título" htmlFor="title" error={form.formState.errors.title?.message}>
        <TextInput id="title" maxLength={255} invalid={Boolean(form.formState.errors.title)} {...form.register('title')} />
      </Field>
      <Field label="Descrição" htmlFor="description" error={form.formState.errors.description?.message}>
        <TextArea
          id="description"
          invalid={Boolean(form.formState.errors.description)}
          {...form.register('description')}
        />
      </Field>
      <Field label="Status" htmlFor="status" error={form.formState.errors.status?.message}>
        <SelectInput id="status" invalid={Boolean(form.formState.errors.status)} {...form.register('status')}>
          {ticketStatuses.map((status: TicketStatus) => (
            <option key={status} value={status}>
              {statusLabel(status)}
            </option>
          ))}
        </SelectInput>
      </Field>
    </>
  )
}
