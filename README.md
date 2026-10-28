# Chamados PontoSat

Sistema para abrir chamados, acompanhar o atendimento e conversar em cada solicitação. A tela é feita em React. Os dados ficam numa API que já existe; este projeto é só a interface.

## Como rodar

Você precisa do [Node.js 22](https://nodejs.org) ou de uma versão mais nova. O npm vem junto.

Abra o terminal na pasta do projeto e rode:

```bash
npm install
npm start
```

`npm run dev` sobe a mesma tela.

Quando o terminal mostrar o endereço, abra [http://127.0.0.1:5173](http://127.0.0.1:5173). Se a porta 5173 estiver ocupada, use o endereço que o terminal imprimir.

Entre com a conta de administrador do desafio:

- E-mail: `administrador@pontosat.com.br`
- Senha: `admin123`

A tela de login abre o quadro de chamados. O computador precisa de internet: a API está em `http://api-segunda-fase.pontosat.net.br:18137`. Se a rede falhar, a mensagem é “Não foi possível conectar à API.”

Arquivo `.env` é opcional. Sem ele, a interface já usa essa API.

## O que você vê depois de entrar

O menu da esquerda tem três itens para o administrador:

- **Chamados** — a fila de atendimento
- **Usuários** — cadastro de quem pode entrar
- **Perfil** — seus dados e quantos chamados você abriu

**Sair** encerra o acesso nesta aba. No celular, o menu abre pelo botão no topo.

O acesso dura 30 minutos e vale só nesta aba. Fechar a aba exige um novo login. E-mail ou senha errados mostram “E-mail ou senha inválidos.” Acesso vencido mostra “Sua sessão expirou. Entre novamente.”

Há dois tipos de conta:

| Quem entra | O que consegue fazer |
|---|---|
| Administrador | Vê a fila, edita chamados, conversa, cadastra pessoas e vê o nome de cada uma |
| Usuário | Abre chamado, acompanha o que a conta enxerga e responde na conversa. O menu **Usuários** não aparece |

Quem abriu o chamado é o dono dele. O sistema não tem um atendente separado.

## Chamados

No topo, quatro números atualizam a cada minuto: quantos estão abertos, quantos estão em atendimento, quantos foram criados na última hora e quantos foram finalizados nas últimas 6 horas.

A fila abre em **Quadro**, com três colunas:

| Coluna | O que significa | Para onde o cartão pode ir |
|---|---|---|
| Aberto | Acabou de chegar | Em atendimento |
| Em atendimento | Alguém está cuidando | Aberto ou Finalizado |
| Finalizado | Encerrado | Fica parado no quadro |

Arraste o cartão ou use **Mover para**. A tela pede confirmação antes de gravar. O chamado aberto há mais tempo, entre os que aparecem na coluna, ganha o aviso “Há mais tempo em aberto”.

**Lista** mostra os mesmos chamados em páginas de 20. No quadro, cada coluna carrega até 500 e mostra 20 por vez, com **Carregar mais**.

**Novo chamado** pede título (até 255 caracteres), descrição e status. O padrão é Aberto. Ao salvar, abre a ficha desse chamado.

Na ficha dá para ler quem abriu, quando foi criado, a conversa, editar e excluir. Excluir pede confirmação e leva o chamado junto com as mensagens. Enquanto salva, o botão fica desligado para o clique não sair duas vezes.

Na ficha, **Editar chamado** aceita qualquer status, inclusive reabrir um finalizado. No quadro, um finalizado não volta.

### Busca e filtros

A busca espera um instante e então procura:

- um número, como `42` ou `#42`, acha aquele chamado
- um texto acha o título; o administrador também acha chamados de pessoas com esse nome; se o nome não existir, a busca olha a descrição

**Unidade** procura esta linha dentro da descrição:

`**Unidade:** Curitiba — Filial`

Troque o nome por uma destas:

- Belo Horizonte — Escritório
- Campinas — Centro de distribuição
- Curitiba — Filial
- Recife — Operação regional
- São Paulo — Matriz

O formulário não escreve essa linha sozinho. Sem ela na descrição, o filtro de unidade não encontra o chamado.

**Abertura** ordena do mais antigo para o mais novo, ou o contrário.

### Etiquetas

**Urgência**, **+ complexo** e **+ simples** ficam só neste navegador. A API não as guarda. **+ complexo** e **+ simples** não ficam juntos no mesmo chamado. Chamado finalizado não mostra etiqueta.

### Conversa

Qualquer pessoa logada escreve na ficha. **Ctrl + Enter** também envia. Texto vazio não sai.

O autor da mensagem e o administrador podem editar ou excluir. Excluir pede confirmação. A conversa mostra até 500 mensagens, da mais antiga para a mais nova, e avisa se existirem mais.

O administrador vê o nome de quem escreveu. O usuário comum vê o próprio nome. As outras pessoas aparecem como “Usuário” e o número da conta.

## Perfil

Mostra nome, e-mail, função, datas e até que horário o acesso desta aba vale. Ao lado, conta quantos chamados você abriu em cada coluna.

**Editar perfil** muda o nome. A senha atual entra mesmo quando só o nome muda. A nova senha só é enviada se o campo estiver preenchido, e a confirmação precisa ser igual. O e-mail não muda. Não há “esqueci minha senha”.

## Usuários

Só o administrador vê esta área. A lista tem 20 contas por página, busca por nome ou e-mail, filtro de perfil e ordem por nome, e-mail ou data de criação.

**Nova conta** pede nome (até 150 caracteres), e-mail, senha e perfil: Usuário ou Administrador.

Na ficha dá para mudar nome, perfil e senha. Senha em branco mantém a atual. O e-mail não muda. A conta com a qual você entrou não pode ser excluída por aqui. Excluir outra conta pede confirmação, e essa pessoa deixa de entrar.

## Para quem for revisar o código

Stack: React 19, TypeScript estrito, Vite, Tailwind CSS, React Router, React Hook Form, Zod, TanStack Query, Vitest e Playwright.

```text
src/app            rotas, sessão e providers
src/features       login, chamados, conversa, usuários e perfil
src/lib/api        cliente HTTP, sessão e recursos
src/lib/validation formulários e filtros
src/components     interface, layout e feedback
e2e                testes de ponta a ponta
```

| Endereço | Quem entra |
|---|---|
| `/entrar` | Qualquer pessoa. Quem já entrou vai para a fila |
| `/` | Quem está logado. Quadro ou lista |
| `/chamados/novo` | Quem está logado |
| `/chamados/123` | Ficha do chamado 123 |
| `/perfil` | Quem está logado |
| `/usuarios` | Administrador |
| `/usuarios/novo` | Administrador |
| `/usuarios/123` | Ficha da conta 123 |

Sem login, a tela volta para `/entrar`. Enquanto confirma o acesso, aparece “Confirmando sua sessão…”.

| Ação | Caminho |
|---|---|
| Entrar | `POST /api/v2/login` |
| Quem está logado | `GET /api/v2/me` |
| Perfil | `PUT /api/v2/users/profile` |
| Contas | `/api/v2/users` |
| Chamados | `/api/v2/tickets` |
| Mensagens | `/api/v2/ticket-interaction` |

A ficha de um chamado ou de uma conta não tem consulta por id. A interface pede a lista com filtro `id` igual ao número da rota. Cada chamada espera no máximo 15 segundos. Documentação da API: [http://api-segunda-fase.pontosat.net.br:18137/docs](http://api-segunda-fase.pontosat.net.br:18137/docs)

Para apontar outra API, crie um `.env` a partir de `.env.example` e preencha `VITE_API_BASE_URL` sem barra no final. Esse arquivo fica fora do Git.

```bash
npm test
npm run lint
npm run typecheck
npm run build
npm run preview
npm run audit
```

O build de produção não gera source map.

O teste de ponta a ponta abre o sistema, cria um chamado e uma conta marcados com `[TESTE]` e apaga os dois. Rode uma vez o navegador e informe a conta na mesma janela do terminal.

PowerShell:

```powershell
$env:E2E_EMAIL = "administrador@pontosat.com.br"
$env:E2E_PASSWORD = "admin123"
npx playwright install chromium
npm run test:e2e
```

Bash:

```bash
export E2E_EMAIL="administrador@pontosat.com.br"
export E2E_PASSWORD="admin123"
npx playwright install chromium
npm run test:e2e
```

Sem o e-mail e a senha, esse teste é ignorado.

A API do desafio responde em HTTP, então e-mail e senha trafegam sem criptografia de transporte. O login devolve um token de acesso e não grava cookie. Uma conta de usuário recebe recusa ao listar ou criar pessoas. Etiquetas e o acesso não acompanham a pessoa para outro navegador. O quadro, a conversa e a lista de nomes param em 500 registros. Não há anexo, atualização ao vivo, recuperação de senha nem troca de e-mail.
