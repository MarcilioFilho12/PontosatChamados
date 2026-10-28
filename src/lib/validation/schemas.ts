import { z } from 'zod'
import type { FilterField } from '@/lib/api/types'
import { roles, ticketStatuses } from '@/lib/api/types'

export const loginFormSchema = z.object({
  email: z.string().trim().email('Informe um e-mail válido.'),
  password: z.string().min(1, 'Informe a senha.'),
})

export const ticketFormSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Informe o título.')
    .max(255, 'O título pode ter no máximo 255 caracteres.'),
  description: z.string().trim().min(1, 'Informe a descrição.'),
  status: z.enum(ticketStatuses),
})

export const interactionFormSchema = z.object({
  text: z.string().trim().min(1, 'Escreva uma mensagem.'),
})

export const createUserFormSchema = z.object({
  name: z.string().trim().min(1, 'Informe o nome.').max(150, 'O nome pode ter no máximo 150 caracteres.'),
  email: z
    .string()
    .trim()
    .min(1, 'Informe o e-mail.')
    .email('Informe um e-mail válido.'),
  password: z.string().min(1, 'Informe a senha.'),
  role: z.enum(roles),
})

export const updateUserFormSchema = z.object({
  name: z.string().trim().min(1, 'Informe o nome.').max(150, 'O nome pode ter no máximo 150 caracteres.'),
  password: z.string(),
  role: z.enum(roles),
})

export const profileFormSchema = z
  .object({
    name: z.string().trim().min(1, 'Informe o nome.').max(150, 'O nome pode ter no máximo 150 caracteres.'),
    currentPassword: z.string().min(1, 'Informe a senha atual.'),
    password: z.string(),
    passwordConfirmation: z.string(),
  })
  .superRefine((value, context) => {
    const changing = value.password.length > 0 || value.passwordConfirmation.length > 0
    if (!changing) return
    if (value.password.length === 0) {
      context.addIssue({ code: 'custom', path: ['password'], message: 'Informe a nova senha.' })
    }
    if (value.password !== value.passwordConfirmation) {
      context.addIssue({
        code: 'custom',
        path: ['passwordConfirmation'],
        message: 'A confirmação não confere.',
      })
    }
  })

export const userSchema = z.object({
  id: z.number(),
  uuid: z.string(),
  name: z.string(),
  email: z.string(),
  role: z.enum(roles),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export const ticketSchema = z.object({
  id: z.number(),
  uuid: z.string(),
  title: z.string(),
  description: z.string(),
  status: z.enum(ticketStatuses),
  id_user: z.number(),
  date_created: z.string(),
  date_updated: z.string(),
})

export const interactionSchema = z.object({
  id: z.number(),
  uuid: z.string(),
  text: z.string(),
  id_user: z.number(),
  id_ticket: z.number(),
  created_at: z.string(),
  updated_at: z.string(),
})

export const filterFieldSchema = z.object({
  value: z.string(),
  name: z.string(),
  type: z.string(),
  default: z.boolean().optional().default(false),
  operators: z.array(z.string()).optional().default([]),
  options: z
    .array(z.object({ value: z.string(), name: z.string() }))
    .optional()
    .default([]),
})

export const loginTokenSchema = z.object({
  access_token: z.string().min(1),
  expires_in: z.number().positive().optional(),
})

export function parseItem<T>(schema: z.ZodType<T>, data: unknown, label: string): T {
  const direct = schema.safeParse(data)
  if (direct.success) return direct.data
  const list = z.array(schema).safeParse(data)
  if (list.success && list.data[0]) return list.data[0]
  throw new Error(`A API retornou ${label} em formato inesperado.`)
}

export function parseList<T>(schema: z.ZodType<T>, data: unknown, label: string): T[] {
  if (data == null) return []
  const list = z.array(schema).safeParse(data)
  if (list.success) return list.data
  const direct = schema.safeParse(data)
  if (direct.success) return [direct.data]
  throw new Error(`A API retornou ${label} em formato inesperado.`)
}

export function parseFilterFields(data: unknown, label: string): FilterField[] {
  return parseList(filterFieldSchema, data, label).map((field) => ({
    value: field.value,
    name: field.name,
    type: field.type,
    default: field.default ?? false,
    operators: field.operators ?? [],
    options: field.options ?? [],
  }))
}

export type LoginFormValues = z.infer<typeof loginFormSchema>
export type TicketFormValues = z.infer<typeof ticketFormSchema>
export type InteractionFormValues = z.infer<typeof interactionFormSchema>
export type CreateUserFormValues = z.infer<typeof createUserFormSchema>
export type UpdateUserFormValues = z.infer<typeof updateUserFormSchema>
export type ProfileFormValues = z.infer<typeof profileFormSchema>
