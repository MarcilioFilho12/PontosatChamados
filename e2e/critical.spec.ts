import { expect, test } from '@playwright/test'

const email = process.env.E2E_EMAIL
const password = process.env.E2E_PASSWORD

test.describe('fluxos críticos', () => {
  test.skip(!email || !password, 'Defina E2E_EMAIL e E2E_PASSWORD para exercitar a API.')

  test('abre, conversa, atualiza e apaga um chamado de teste', async ({ page }) => {
    const stamp = Date.now()
    const title = `[TESTE] chamado ${stamp}`

    await page.goto('/entrar')
    await page.getByLabel('E-mail').fill(email ?? '')
    await page.getByLabel('Senha').fill(password ?? '')
    await page.getByRole('button', { name: 'Entrar' }).click()
    await expect(page.getByRole('heading', { name: 'Chamados' })).toBeVisible()

    await page.getByRole('link', { name: 'Novo chamado' }).click()
    await page.getByLabel('Título').fill(title)
    await page.getByLabel('Descrição').fill('Registro temporário do teste de ponta a ponta.')
    await page.getByRole('button', { name: 'Abrir chamado' }).click()
    await expect(page.getByRole('heading', { level: 1, name: title })).toBeVisible()

    await page.getByLabel('Mensagem').fill('[TESTE] mensagem temporária')
    await page.getByRole('button', { name: 'Publicar' }).click()
    await expect(page.getByText('[TESTE] mensagem temporária')).toBeVisible()

    await page.getByRole('button', { name: 'Editar chamado' }).click()
    await page.getByLabel('Status').selectOption('in_progress')
    await page.getByRole('button', { name: 'Salvar alterações' }).click()
    await expect(page.getByText('Em atendimento').first()).toBeVisible()

    await page.getByRole('button', { name: 'Excluir chamado' }).click()
    await expect(page.getByRole('heading', { name: 'Excluir chamado?' })).toBeVisible()
    await page.getByRole('dialog').getByRole('button', { name: 'Excluir chamado' }).click()
    await expect(page.getByRole('heading', { name: 'Chamados' })).toBeVisible()
  })

  test('cria e apaga uma conta de teste', async ({ page }) => {
    const stamp = Date.now()
    const name = `[TESTE] Conta ${stamp}`
    const account = `qa.e2e.${stamp}@example.com`

    await page.goto('/entrar')
    await page.getByLabel('E-mail').fill(email ?? '')
    await page.getByLabel('Senha').fill(password ?? '')
    await page.getByRole('button', { name: 'Entrar' }).click()
    await page.getByRole('link', { name: 'Usuários' }).click()
    await page.getByRole('link', { name: 'Nova conta' }).click()
    await page.getByLabel('Nome').fill(name)
    await page.getByLabel('E-mail').fill(account)
    await page.getByLabel('Senha').fill(`Temp-${stamp}-Aa`)
    await page.getByRole('button', { name: 'Criar conta' }).click()
    await expect(page.getByRole('heading', { level: 1, name })).toBeVisible()
    await page.getByRole('button', { name: 'Excluir conta' }).click()
    await expect(page.getByRole('heading', { name: 'Excluir conta?' })).toBeVisible()
    await page.getByRole('dialog').getByRole('button', { name: 'Excluir conta' }).click()
    await expect(page.getByRole('heading', { name: 'Usuários' })).toBeVisible()
  })
})
