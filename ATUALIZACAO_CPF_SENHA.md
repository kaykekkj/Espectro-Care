# Atualização: CPF, senha e rodapés

Publicar junto ao PR do backend `DiegodsGuinazu/BackEnd_TCC_3DS` e ao app `GiovanniBarattaL/NeuroHelp`. O backend deve entrar primeiro.

- `assets/js/form-utils.js`: validação matemática de CPF; cadastros profissional/responsável usam a mesma regra e o backend revalida antes de salvar. A opção sem CPF do responsável permanece.
- `pages/userProfissional.html` e `pages/userResponsavel.html`: “Alterar senha” logo abaixo do e-mail.
- `pages/login.html`: “Esqueci minha senha” junto à criação de conta, com quebra de linha em telas estreitas.
- `pages/recuperar-senha.html`, `assets/js/recuperar-senha.js`, `assets/css/recuperar-senha.css`: envio e confirmação de código temporário, senha forte, confirmação e retorno ao login. No fluxo do perfil, destinatário é obtido pelo servidor autenticado, não pelo formulário. Nenhuma senha/código em URL ou localStorage.
- `pages/profissionais.html` e `pages/aprendizagem.html`: rodapés com Início, Sobre nós, Profissionais, Aprendizagem, Meu perfil e Recuperar senha. Substituem destinos `#` desabilitados por páginas reais. Nenhum texto de política legal ou contato fictício foi criado.
- `assets/css/integracao.css`: layout dos links do login e link da troca de senha, sem alterar as regras das demais páginas.

## Executar/testar

Execute `node --test tests/*.test.cjs`. Sirva a pasta com `py -3.11 -m http.server 5500` (Windows) e abra `http://localhost:5500/pages/login.html`. Confira se a origem está na lista CORS do backend.

1. Tente cadastrar CPF com 11 dígitos repetidos ou dígito verificador alterado: deve sinalizar “CPF inválido”. Responsável pode escolher não cadastrar CPF.
2. Acesse cada perfil e clique em Alterar senha abaixo do e-mail. E-mail deve estar bloqueado para edição; Enviar código deve chamar `/api/conta/recuperacao-senha` sem destinatário no corpo.
3. Pelo login, clique em Esqueci minha senha, informe e-mail, receba o código e confirme uma senha forte. Teste confirmação divergente, senha fraca, código errado, expirado e reutilizado.
4. Após sucesso, formulários somem e aparece link para entrar. A sessão local é removida e a API recusa os JWTs antigos em outros dispositivos.
5. Abra as duas listagens em larguras de 360, 768 e 1440 px; confira todos os links do rodapé, navegação e ausência de rolagem horizontal.

Entrega real depende do Gmail configurado somente no backend: `EMAIL_PROVIDER=gmail`, `GMAIL_CLIENT_ID`, `GMAIL_CLIENT_SECRET`, `GMAIL_REFRESH_TOKEN` e `GMAIL_SENDER`. Consulte `docs/GMAIL_RECUPERACAO_SENHA.md` do backend. Nenhum segredo vai para o site. A validação matemática **não confirma existência ou titularidade na Receita**; a consulta oficial está pendente de contratação/credenciais.

Para desfazer, reverta este commit. Não há migração de dados no site.

## Alinhamento com o backend integrado (PR #7)

Compatível com `main` após https://github.com/DiegodsGuinazu/BackEnd_TCC_3DS/pull/7 . Não mesclar o PR #6 para aplicar estes clientes. O endpoint autenticado é `POST /api/conta/recuperacao-senha` sem corpo; solicitações públicas usam `/auth/esqueci-senha` e confirmações usam `/auth/redefinir-senha`. As três operações retornam HTTP 200 no sucesso, com `mensagem`. A rota pública de validação matemática é `POST /validacoes/cpf`; os cadastros continuam revalidando CPF diretamente.

Código vale por 15 minutos, tem cinco tentativas e uso único. Reenvio após 60 segundos substitui o código anterior; limites adicionais podem retornar 429. Use a migração `2026-10-19-cpf-recuperacao-senha.sql` da `main` e a documentação atual do backend.

## Envio por Gmail — PR #8

O backend na main inclui o PR #8, que preserva os contratos do #7 usados por este cliente. Gmail é configurado apenas no Render/backend. Nenhuma chave, JSON OAuth ou token deve ser copiado para o site/app. A migração PostgreSQL continua sendo a do #7. Confira o deploy, o banco e a entrega real antes de publicar.
