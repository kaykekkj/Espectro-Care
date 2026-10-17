# Aplicar a atualização do site

Repositório: `kaykekkj/Espectro-Care`. Esta entrega usa a versão atual da main e depende do backend de `DiegodsGuinazu/BackEnd_TCC_3DS` com os novos campos de postagem.

## Ordem de aplicação

1. No backend, aplique `docs/sql/2026-10-17-postagens.sql` no PostgreSQL de homologação, após backup. Execute os testes, revise os checks do PR e publique o backend conforme `docs/POSTAGENS_COM_IMAGEM.md`.
2. No GitHub do site, revise e integre o PR desta entrega. Alternativamente, aplique o patch fornecido na entrega local usando `git apply --check` antes de `git apply`. Não aplique PR e patch simultaneamente.
3. Confira `assets/js/api-config.js`: a API padrão continua sendo a configurada no projeto. O override `espectrocare_api_base_url` no armazenamento do navegador é reservado para testes; remova overrides locais ao testar produção. Configure CORS na API com a origem exata do site.
4. Publique o site pelo processo habitual e atualize o navegador para carregar os arquivos novos. Não é necessário instalar bibliotecas para o site funcionar.
5. Entre com uma conta ADMIN, abra Aprendizagem e clique em Criar postagem. Preencha título, conteúdo, imagem JPG/PNG de até 2 MB, resumo e referências (uma URL HTTP/HTTPS por linha). Ao editar, a imagem atual permanece se nenhum arquivo novo for escolhido.
6. Abra a postagem com uma conta de responsável: confira imagem, conteúdo, resumo, referências clicáveis e outras postagens. Teste também com profissional: ambos devem ler, sem botões de criar/editar/excluir. O backend deve retornar 403 para tentativas diretas de escrita desses perfis e 401 sem autenticação.
7. Confira Início, Sobre Nós e formulários no celular em pé e deitado; abra o menu e navegue pelo carrossel nos dois sentidos, inclusive ao trocar a largura da janela.

## Mudanças

- Imagem nos cards e no artigo, envio e prévia no editor administrativo; resumo antes das referências; referências externas abertas com proteção de nova aba.
- Até três recomendações de outras postagens, priorizando categorias comuns e depois a ordem da listagem (mais recentes). A postagem atual é excluída. A seção aparece quando há outras postagens.
- Carrossel infinito por botões nos dois sentidos, com espaçamento medido do CSS e reposicionamento após a transição; sem reprodução automática. Cópias ficam fora da navegação assistiva e a preferência por movimento reduzido é respeitada.
- Fundos de Início com alturas flexíveis e sobreposição mais clara no celular; fundo dos formulários sem esticar com toda a página; ajustes de tablet, cards e editor. Menu fechado não mantém opções focáveis fora da tela e respeita `hidden` nos itens da sessão.
- Cinco fotos de equipe ausentes no repositório foram substituídas por iniciais. As fotos de Bianca e Giovanni foram preservadas. Para acrescentar fotos reais, adicione os arquivos e substitua os spans correspondentes em `pages/sobre-nos.html`.

Artigos antigos não são apagados. Campos ainda não cadastrados ficam ocultos na leitura e podem ser preenchidos ao editar. As capas são públicas, como os cards. Não use imagens confidenciais.

## Testes

`tests/responsividade.cjs` usa API simulada para verificar as 15 páginas em 320/375/768/1024/1440 px, imagens locais, menu, editor e carrossel. `tests/e2e.cjs` usa a API real local para convites, permissões, CRUD, leitura do artigo, fotos e perfis. Veja `tests/README.md` para pré-requisitos. Os testes não acessam o banco de produção.

A simulação de tamanhos em Edge/Chromium não substitui a conferência em aparelhos reais, especialmente Safari/iOS. Fontes e ícones de CDN continuam dependendo de rede. Como melhoria futura, considerar hospedar essas dependências com o site e fornecer as fotos reais restantes.

## Reverter

Republique o commit anterior do site. Se também for reverter o backend, siga a ordem e as instruções de `docs/POSTAGENS_COM_IMAGEM.md`; preserve os dados e as novas colunas.
