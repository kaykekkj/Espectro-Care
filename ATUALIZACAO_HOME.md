# Home, navegação e CRM — 26/10/2026

## Resultado

- Home, artigo e Sobre nós reaproveitam o footer completo já usado nas duas listagens. Profissionais e Aprendizagem não precisaram de alteração no footer. O CSS original `footer.css` foi preservado; todos os links levam a páginas existentes.
- A seção Conheça o TEA usa `GET /api/aprendizagem`, com até quatro publicados por `dataCriacao` decrescente, ID e `imagemUrl` reais. O DTO não possui destaque. Não há cards fictícios. Há carregamento, repetição da tentativa, vazio, acesso recusado e alternativa neutra para capa ausente ou quebrada.
- Os seis cards profissionais são links semânticos com `?especialidade=...`. O filtro visível combina a área e a pesquisa existente; Limpar filtros restaura a listagem.
- O backend atual tem somente `formacao`, sem especialidade estruturada. `especialidades.js` mapeia denominações completas conhecidas, com normalização de acentos, espaços e caixa. Não usa bio, CRM, fragmentos ou Medicina para inferir especialidade. Textos livres como “Graduação em Psicologia pela instituição X” continuam disponíveis na busca, mas não são classificados automaticamente. O filtro não comprova título de especialista.
- A seção do aplicativo usa medidas flexíveis, cards que mudam de colunas, textos menores e a imagem original com overlay. Foram retiradas as regras antigas conflitantes de `ajustes-responsivos.css`. Não foi acrescentado `overflow-x: hidden`.
- Cadastro e perfil oferecem seleção de CRM ou outro conselho. CRM tem número de 1 a 7 dígitos, UF própria e opção provisória. Outros conselhos mantêm o limite anterior. A consulta diferencia regular, não encontrado, situação irregular, nome divergente e indisponibilidade. Removida da Home a promessa de que todos os profissionais já passaram por verificação documental.

## Autenticação e API

As listagens existentes são públicas; detalhes continuam protegidos. Cards de artigos usam o mesmo ActionGate das listagens. Visitante e token expirado vão para o login preservando o ID. A correção do caminho de login também funciona na Home e em subpastas. Respostas 401/403 não são exibidas como artigos públicos.

Nenhum contrato de artigo ou profissional foi alterado. A integração nova é `POST /validacoes/crm` do backend correspondente. O formulário mantém `numRegistro` como string: `CRM-SP 1234567` ou `CRM-SP 1234567-P`. Isso permite preservar DTOs, banco e clientes Android existentes, sem migração.

**Pré-requisito do CRM:** aplicar o PR do backend e configurar nele `CFM_CHAVE`, obtida no serviço oficial. O limite de sete dígitos vem da seção 4.1 do [manual atual do CFM](https://sis.cfm.org.br/listamedicos/arquivos/manualwebservices.pdf). Consulta real depende de [credenciamento no CFM](https://sis.cfm.org.br/listamedicos/informacoes). A interface nunca declara um registro verdadeiro só pelo formato nem classifica falha de serviço como falsidade.

Sem chave, cadastro ou alteração de um registro explicitamente identificado como CRM retorna 503 no backend. Configure antes de disponibilizar esse fluxo. O link público do CFM permite conferência manual, mas não libera um cadastro recusado pelo servidor. O seletor não transforma registros numéricos legados de conselho desconhecido em CRM.

## Validação realizada

- Suíte local `home-integracao.cjs`: passou. Cobre artigos ordenados, quatro IDs reais, capas, zero a três publicações, carregamento, API 500, resposta inválida, 401/403 e nova tentativa.
- Cinco footers: seis destinos existentes por página, logos resolvidos e estrutura consistente.
- Seis cards/filtros: passou. Busca por nome, formação e cidade, acentos, combinação, limpeza, área desconhecida e resultado vazio.
- Autenticação: visitante e sessão expirada seguem ao login com o ID correto.
- Formulários: limite de sete dígitos, rejeição de zero/letras, respostas de CRM simuladas e preservação de outros conselhos; leitura do CRM provisório salvo.
- Layout: 1440, 1024, 768, 480, 390 e 360px, medindo elementos da Home e largura do documento com o `overflow-x` herdado desativado. Sem vazamento horizontal. Capturas revisadas em desktop e celular.
- Nenhuma nova exceção JavaScript nas páginas e fluxos testados. Falhas HTTP simuladas podem gerar mensagens de recurso na aba Network do navegador.
- Cinco testes existentes de CPF/recuperação de senha: passaram. Verificação de sintaxe JavaScript e `git diff --check`: passaram.
- Consultas GET somente leitura em produção: 200 nas duas listagens, com 4 artigos e 6 profissionais no momento da análise. Campos conferidos com os DTOs atuais; nenhum dado foi modificado.

Não foi executada a suíte completa que exige API local com banco e contas. O teste end-to-end do CFM real depende da chave credenciada; as respostas de CRM no navegador foram simuladas. Não foi feito deploy nem merge.

## Executar e aplicar

1. Revisar os PRs de frontend e backend e configurar o CRM conforme o documento do backend.
2. Aplicar as branches pelo fluxo normal de revisão, preservando a integração atual do site.
3. Executar a suíte como descrito em `tests/README.md`; depois testar um cadastro CRM e um registro de outro conselho em ambiente de homologação.
4. Para desfazer, reverter o commit deste PR. Não há alteração de banco de dados.

## Arquivos alterados ou adicionados

- `.gitignore`, `ATUALIZACAO_HOME.md`
- `index.html`
- `pages/aprendizagemdoc1.html`, `pages/sobre-nos.html`, `pages/profissionais.html`, `pages/cadastro-profissional.html`, `pages/userProfissional.html`
- `assets/css/Home.css`, `assets/css/ajustes-responsivos.css`, `assets/css/profissionais.css`, `assets/css/registro-profissional.css`
- `assets/js/action-gate.js`, `assets/js/home-artigos.js`, `assets/js/especialidades.js`, `assets/js/profissionais.js`, `assets/js/registro-profissional.js`, `assets/js/cadastrar-profissional.js`, `assets/js/carregarPerfil.js`
- `tests/home-integracao.cjs`, `tests/package.json`, `tests/README.md`

## Evolução recomendada

Adicionar especialidade estruturada e conselho/UF em campos próprios, com migração compatível com o aplicativo. Isso permite classificar formações livres sem adivinhação e exigir CRM de médicos com base no tipo profissional confirmado. A consulta por nome e CRM não comprova identidade de quem preenche o formulário e não cria selo público de verificação.
