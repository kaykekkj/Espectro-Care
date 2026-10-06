# Teste integrado do site

Use somente banco/API **locais e exclusivos de teste**. O teste recusa URLs de produção. Os dados usam o domínio reservado `teste.invalid`. Só são excluídas postagens criadas pelo próprio teste; contas/convites de teste podem permanecer nessa base descartável.

1. Inicie a API em `http://127.0.0.1:8088`, usando H2 persistente exclusivo de teste, JWT fictício, `FRONTEND_URL=http://127.0.0.1:5500` e `CORS_ALLOWED_ORIGINS=http://127.0.0.1:5500`. Nunca reutilize credenciais ou o banco real.
2. Antes de iniciar a API, gere o primeiro convite com `ADMIN_INVITE_EMAIL=admin-e2e@teste.invalid` e `ADMIN_INVITE_OUTPUT` apontando para um arquivo privado novo, pelo procedimento do backend. O teste cadastra essa conta com senha exclusiva de teste `Senha@123`. Se a conta já existir nessa base, fará login diretamente.
3. Sirva a raiz do frontend na porta 5500 (`python -m http.server 5500 --bind 127.0.0.1`).
4. Na pasta `tests`, execute `npm install` e `npx playwright install chromium`.
5. Defina `TEST_INVITE_FILE` com o caminho do arquivo privado, `TEST_OUTPUT_DIR` com uma pasta de resultados fora do site e execute `npm test`. Opcionalmente defina `TEST_BROWSER_PATH` com o executável de um Chromium/Edge instalado; nesse caso o download do Chromium não é necessário.

O teste verifica cadastro pelo convite, remoção do token do histórico, login, geração/revogação, CRUD de postagens com confirmação, fotos de ambos os perfis, persistência após recarga/novo login, apresentação dos números, foco e ausência de sublinhado, controles por perfil e largura de 375/1280 px. Gera capturas e `relatorio.json`, sem registrar senhas ou tokens. O arquivo privado não deve ser incluído em ZIP, commit ou logs. Cenários de expiração, reutilização e concorrência são cobertos pelos testes do backend.

Para repetir em uma base realmente limpa, crie **outro banco de teste**; não limpe tabelas reais. O teste usa IDs para identificar os novos registros, permitindo execução repetida nessa base local.
