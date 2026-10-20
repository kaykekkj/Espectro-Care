# Confirmação de e-mail no cadastro

Depende do backend do PR #10:
https://github.com/DiegodsGuinazu/BackEnd_TCC_3DS/pull/10

Nos dois formulários, após a validação dos dados, abre-se uma janela para confirmar
o endereço com oito dígitos. O código é solicitado sem enviar nome, senha, CPF ou
outros dados. Somente a confirmação final envia o cadastro com `codigoEmail`.
Código incorreto mantém a janela aberta; é possível reenviar após 60 segundos
ou voltar para corrigir o endereço e os demais dados. Escape também permite voltar
quando não houver requisição em andamento. Senhas e códigos não são gravados em
armazenamento do navegador nem na URL.

Contas anteriores, login, perfil e recuperação de senha não mudam. O novo backend
recusa novos cadastros feitos por versões antigas dos clientes sem confirmação;
preparar site e aplicativo antes de publicar o PR do backend.

Teste sem e-mail real ou banco: `node tests/confirmacao-email.e2e.cjs`, com
Playwright/Chromium instalados conforme `tests/README.md`. A suíte simula a API
e verifica os dois formulários, códigos com zero inicial, erro, reenvio, correção,
conclusão e layout em 375/1280 px. Os testes Node de CPF e recuperação continuam
em `node --test tests/cpf.test.cjs tests/recuperar-senha.test.cjs`.
