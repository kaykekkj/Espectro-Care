# CRM gratuito — 26/10/2026

O cadastro não exige consulta ao CFM. A conferência é gratuita e manual pela equipe: o profissional clica em **Validar CRM**, a solicitação fica em análise e um administrador consulta o portal público. Abrir o link ou clicar no botão não concede selo de autenticidade.

- Minha Área: aviso ao lado do nome e botão abaixo do registro.
- Edição do perfil: estado, botão e instrução para salvar alterações antes de solicitar.
- Profissionais: estado entre formação e localização.
- Ver perfil: estado acima de Registro.
- Administração: fila paginada de pedidos, link oficial, confirmação explícita de que os dados foram conferidos e ações Confirmar/Não confirmado.

O cadastro e o perfil permanecem disponíveis nos estados pendente, em análise e não confirmado. CRM conferido mostra a data da consulta manual; não comprova identidade ou especialidade. Mudar nome/registro invalida o selo; apenas o backend decide o estado. Outros conselhos e registros numéricos sem identificação ficam como Registro não verificado. Psicólogos usam CRP, e não recebem selo CRM indevidamente.

## Aplicar

1. Aplicar o backend correspondente. Executar antes no Neon o SQL `docs/sql/2026-10-26-crm-conferencia-manual.sql`, principalmente quando o Render usa ddl-auto=validate. Não há chave ou variável nova obrigatória.
2. Revisar o frontend e publicar depois do backend. As rotas atuais de autenticação/detalhes continuam protegidas.
3. Usar uma conta administrativa já existente para consultar e confirmar os pedidos.

A integração inclui `POST /api/perfil/crm/solicitacao` e as rotas administrativas `GET/PUT /api/admin/crm/solicitacoes`. Os DTOs recebem o objeto adicional `crmVerificacao`; os campos existentes são preservados. A rota antiga `/validacoes/crm` continua respondendo, mas só confirma formato (`valido:null`, `cadastroConsultado:false`). Não há alterações de telas Android.

## Validação e limites

Passaram 12 testes Node: sete de CRM e cinco já existentes de CPF/recuperação. Sintaxe de todos os JavaScripts e IDs/referências locais das cinco páginas verificadas. Playwright não executou por ausência de binário Chromium; o navegador remoto também não acessou o servidor local. A revisão visual nas seis larguras permanece pendente. A suíte Java ficou bloqueada por Java 17 e download do Gradle indisponível; precisa rodar com Java 21, junto com PostgreSQL, bootJar e Docker, antes de publicar. Não houve alteração em produção.

Execute em `tests`: `npm run test:crm`. Para o teste de navegação: servidor local na porta 5517, `npm ci`, `npx playwright install chromium` e `npm run test:crm:e2e`.

Para desfazer, reverta o PR de frontend em conjunto com o backend apropriado; mantenha as colunas do banco. Recomendações: histórico completo de análises e política de reconferência periódica definidos pela equipe. O estado atual mantém a última decisão/data/revisor e depende de revisão humana.
