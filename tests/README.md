# Teste integrado do site

Use somente banco/API **locais e exclusivos de teste**. O teste recusa URLs de produção. Os dados usam o domínio reservado `teste.invalid`. Só são excluídas postagens criadas pelo próprio teste; contas/convites de teste podem permanecer nessa base descartável.

1. Inicie a API em `http://127.0.0.1:8088`, usando H2 persistente exclusivo de teste, JWT fictício, `FRONTEND_URL=http://127.0.0.1:5500` e `CORS_ALLOWED_ORIGINS=http://127.0.0.1:5500`. Nunca reutilize credenciais ou o banco real.
2. Antes de iniciar a API, gere o primeiro convite com `ADMIN_INVITE_EMAIL=admin-e2e@teste.invalid` e `ADMIN_INVITE_OUTPUT` apontando para um arquivo privado novo, pelo procedimento do backend. O teste cadastra essa conta com senha exclusiva de teste `Senha@123`. Se a conta já existir nessa base, fará login diretamente.
3. Prepare previamente na base local um profissional e um responsável de teste com senha `Senha@123` e e-mails no domínio `teste.invalid` (fixtures locais). No profissional, use telefone `11987654321` e registro `REG-E2E`. Defina `TEST_PROF_EMAIL` e `TEST_RESP_EMAIL` com esses endereços. O teste integrado de fotos usa essas contas; não tenta contornar a confirmação de cadastro.
4. Sirva a raiz do frontend na porta 5500 (`python -m http.server 5500 --bind 127.0.0.1`).
5. Na pasta `tests`, execute `npm install` e `npx playwright install chromium`.
6. Defina `TEST_INVITE_FILE` com o caminho do arquivo privado, `TEST_OUTPUT_DIR` com uma pasta de resultados fora do site e execute `npm test`. Opcionalmente defina `TEST_BROWSER_PATH` com o executável de um Chromium/Edge instalado; nesse caso o download do Chromium não é necessário.

O teste verifica cadastro pelo convite, remoção do token do histórico, login, geração/revogação, CRUD de postagens com confirmação, fotos de ambos os perfis, persistência após recarga/novo login, apresentação dos números, foco e ausência de sublinhado, controles por perfil e largura de 375/1280 px. Gera capturas e `relatorio.json`, sem registrar senhas ou tokens. O arquivo privado não deve ser incluído em ZIP, commit ou logs. Cenários de expiração, reutilização e concorrência são cobertos pelos testes do backend.

Para repetir em uma base realmente limpa, crie **outro banco de teste**; não limpe tabelas reais. O teste usa IDs para identificar os novos registros, permitindo execução repetida nessa base local.

## Responsividade sem API real

Sirva a raiz do site em `http://127.0.0.1:5517`, instale as dependências acima e execute `node responsividade.cjs` na pasta `tests`. Opcionalmente configure `TEST_SITE_URL`, `TEST_BROWSER_PATH` e `TEST_OUTPUT_DIR`. O teste simula somente a API e bloqueia recursos externos para evitar dependência de CDN. Verifica as 15 páginas em cinco larguras, menu móvel, volta completa do carrossel nos dois sentidos, criação pelo formulário administrativo, ausência de controles nos outros perfis, imagem/resumo/referências/recomendações. Gera capturas e relatório em `resultados-responsividade/` (ignorado pelo Git).

O E2E com API real agora também envia os novos campos obrigatórios e confere imagem, resumo, links e recomendações. Em ambos os testes, capas de uma cor são arquivos artificiais de teste, não imagens destinadas à produção.


## Confirmação de e-mail sem API real

Na pasta `tests`, após instalar as dependências e Chromium, execute:

```sh
node confirmacao-email.e2e.cjs
```

O teste inicia e encerra um servidor local, bloqueia serviços externos e simula
as respostas da API. Não envia e-mails e não modifica banco algum. Valida os dois
formulários, envio sem senha, zeros iniciais, código incorreto, reenvio com
intervalo, correção de endereço, conclusão e ausência de overflow em 375/1280 px.
Se necessário, `BROWSER_EXECUTABLE` aponta para um Chromium instalado.
Os testes HTTP reais do backend cobrem consumo único, tentativas, expiração,
concorrência e compatibilidade com contas anteriores.


## Home, filtros e CRM

A suíte `home-integracao.cjs` usa dados sintéticos e intercepta a API, sem gravar em produção.

1. Na raiz do site: `python -m http.server 5517 --bind 127.0.0.1`.
2. Em outro terminal: `cd tests`, `npm ci` e `npm run test:home`.
3. Se necessário, instale o navegador: `npx playwright install chromium`.
4. Use `TEST_SITE_URL` para outra porta local e `TEST_BROWSER_PATH` para um Chromium instalado.

O relatório e capturas ficam em `tests/resultados-home/` (ignorados pelo Git).
São verificados os cinco footers, seis filtros, pesquisa combinada, login,
estados da listagem de artigos, formatos de CRM e seis larguras de tela.
As respostas simuladas de CRM não substituem os testes do backend ou uma consulta real credenciada.
