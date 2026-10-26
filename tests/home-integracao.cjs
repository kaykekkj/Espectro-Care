// Executa somente em site local, com API simulada e dados sintéticos.
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const site = process.env.TEST_SITE_URL || 'http://127.0.0.1:5517';
assert(['localhost','127.0.0.1'].includes(new URL(site).hostname));
const output = process.env.TEST_OUTPUT_DIR || path.join(__dirname, 'resultados-home');
fs.mkdirSync(output, {recursive:true});
const image = fs.readFileSync(path.join(__dirname, 'foto-teste.png'));
const widths = [1440,1024,768,480,390,360];
const articles = [
 {id:10,titulo:'Mais antigo',dataCriacao:'2026-09-01T12:00:00'},
 {id:41,titulo:'Informação e acolhimento',dataCriacao:'2026-10-25T12:00:00',imagemUrl:'/api/aprendizagem/41/imagem'},
 {id:32,titulo:'Família e escola',dataCriacao:'2026-10-23T12:00:00',imagemUrl:'/api/aprendizagem/32/imagem'},
 {id:30,titulo:'Artigo sem capa',dataCriacao:'2026-10-22T12:00:00'},
 {id:20,titulo:'Rotina de cuidado',dataCriacao:'2026-10-20T12:00:00'}
];
const formations = ['PSICÓLOGA','Fonoaudiologia','Terapia Ocupacional','Nutrição','Neurologia Pediátrica','Psiquiatria'];
const keys = ['psicologo','fonoaudiologo','terapeuta-ocupacional','nutricionista','neuropediatra','psiquiatra'];
const people = formations.map((formacao,i)=>({id:i+1,nome:'Profissional '+(i+1),formacao,cidade:i===0?'São Paulo':'Campinas',estado:'SP',bio:'Atendimento de teste'}));
people.push({id:99,nome:'Não classificar por texto solto',formacao:'Medicina',bio:'Atua com psiquiatras e nutricionistas'});
people.push({id:98,nome:'Formação livre',formacao:'Estudante de Psicologia'});
const user = {id:1,tipoPerfil:'PROFISSIONAL',nome:'Profissional Exemplo',email:'teste@example.org'};
(async()=>{
 const browser=await chromium.launch({headless:true,...(process.env.TEST_BROWSER_PATH?{executablePath:process.env.TEST_BROWSER_PATH,args:['--no-sandbox','--disable-dev-shm-usage']}: {})});
 const report={checks:[],layouts:[],errors:[]};
 try {
  const context=await browser.newContext();
  context.setDefaultTimeout(10000);
  let articleMode='ok', sessionMode='ok', crmMode='regular', detailRequests=0;
  let articleData=articles, professionalData=people, delay=false;
  await context.addInitScript(({site})=>{localStorage.setItem('espectrocare_api_base_url',site);localStorage.setItem('token','token-de-teste');},{site});
  await context.route('https://**/*',r=>r.abort());
  await context.route('**/api/**',async route=>{
   const resource=new URL(route.request().url()).pathname;
   if(resource==='/api/auth/me') return route.fulfill({status:sessionMode==='expired'?401:sessionMode==='error'?500:200,json:user});
   if(resource==='/api/aprendizagem') {
    if(delay) await new Promise(resolve=>setTimeout(resolve,400));
    return route.fulfill({status:articleMode==='error'?500:articleMode==='unauthorized'?401:articleMode==='forbidden'?403:200,json:articleMode==='invalid'?{}:articleData});
   }
   if(resource==='/api/aprendizagem/41/imagem') return route.fulfill({contentType:'image/png',body:image});
   if(resource==='/api/aprendizagem/32/imagem') return route.fulfill({status:404,json:{}});
   if(resource==='/api/profissionais') return route.fulfill({json:professionalData});
   if(resource==='/api/perfil') return route.fulfill({json:{...user,formacao:'Psiquiatria',numRegistro:'CRM-SP 1234567-P'}});
   if(resource.startsWith('/api/aprendizagem/')||resource.startsWith('/api/profissionais/')) {detailRequests++;return route.fulfill({json:{...articles[1],conteudoHtml:'<p>Conteúdo educativo.</p>',categorias:[]}});}
   return route.fulfill({json:{}});
  });
  await context.route('**/validacoes/crm', route=>route.fulfill({status:crmMode==='unavailable'?503:200,json:crmMode==='unavailable'
   ?{mensagem:'Consulta ao CFM ainda não configurada. Não foi possível confirmar o CRM.'}
   :{valido:crmMode==='regular',cadastroConsultado:true,mensagem:crmMode==='regular'?'CRM localizado, regular e com nome correspondente no CFM.':'CRM não encontrado no CFM para a UF informada.'}}));
  await context.route('**/servicodados.ibge.gov.br/**',r=>r.fulfill({json:[]}));
  const page=await context.newPage();
  page.on('pageerror',error=>report.errors.push({url:page.url(),message:error.message}));
  const check=name=>{report.checks.push(name);console.log('OK:',name);};
  await page.goto(site+'/index.html');
  await page.locator('#homeArtigos[aria-busy=false]').waitFor({state:'attached'});
  assert.equal(await page.locator('.card-artigo-home').count(),4);
  assert.deepEqual(await page.locator('.card-artigo-home').evaluateAll(list=>list.map(el=>new URL(el.href).searchParams.get('id'))),['41','32','30','20']);
  await page.locator('.card-artigo-home img').first().scrollIntoViewIfNeeded();
  await page.waitForFunction(()=>document.querySelector('.card-artigo-home img')?.naturalWidth>0);
  assert.equal(await page.locator('.home-artigo-sem-capa').count(),3);
  check('Home usa os quatro publicados mais recentes, IDs reais, capa real e alternativa para capa ausente/com falha');
  await page.locator('.card-artigo-home').first().click();await page.waitForURL('**/pages/aprendizagemdoc1.html?id=41');
  await page.locator('#artigoTitulo').filter({hasText:articles[1].titulo}).waitFor();
  check('Usuário autenticado abre o artigo com o identificador correto');
  for(const width of widths){
   await page.setViewportSize({width,height:900});
   await page.goto(site+'/index.html');await page.locator('#homeArtigos[aria-busy=false]').waitFor({state:'attached'});
   // Desativa o overflow herdado do projeto durante a medição para não ocultar defeitos.
   await page.addStyleTag({content:'html,body {overflow-x:visible !important}'});
   const result=await page.evaluate(()=>({scrollWidth:document.documentElement.scrollWidth,width:innerWidth,
    overflow:[...document.querySelectorAll('main,main *,footer,footer *')].filter(el=>{
     const r=el.getBoundingClientRect(),s=getComputedStyle(el);
     return r.width>0 && r.height>0 && s.visibility!=='hidden' && (r.right>innerWidth+1||r.left< -1);
    }).map(el=>el.className||el.tagName)}));
   report.layouts.push({width,...result});assert(result.scrollWidth<=width+1,JSON.stringify(result));assert.equal(result.overflow.length,0,JSON.stringify(result));
   await page.locator('.aplicativo-home').screenshot({path:path.join(output,`aplicativo-${width}.png`),style:'.navbar{visibility:hidden}'});
   if([1440,390].includes(width)) await page.screenshot({path:path.join(output,`home-${width}.png`),fullPage:true});
  }
  check('Home e aplicativo sem transbordamento em 1440, 1024, 768, 480, 390 e 360px, com overflow visível');
  for(const file of ['index.html','pages/profissionais.html','pages/aprendizagem.html','pages/aprendizagemdoc1.html?id=41','pages/sobre-nos.html']) {
   await page.goto(site+'/'+file);
   const links=await page.locator('footer a').evaluateAll(list=>list.map(x=>new URL(x.href).pathname));
   assert.deepEqual(links,['/index.html','/pages/sobre-nos.html','/pages/profissionais.html','/pages/aprendizagem.html','/pages/area-usuario.html','/pages/recuperar-senha.html'],file);
   for(const link of links) assert.equal((await context.request.get(site+link)).status(),200);
   assert(await page.locator('footer img').evaluate(el=>el.complete&&el.naturalWidth>0));
   assert(await page.locator('footer').isVisible());
  }
  check('Cinco footers consistentes, seis destinos existentes em cada um e logo resolvido');
  for(let i=0;i<keys.length;i++) {
   await page.goto(site+'/index.html');
   await page.locator(`.conteiner-prof-home a[href$="especialidade=${keys[i]}"]`).click();
   await page.locator('.api-professional-card').first().waitFor();
   assert.equal(await page.locator('#especialidadeFiltro').inputValue(),keys[i]);
   assert.equal(await page.locator('.api-professional-card').count(),1);
   assert.equal(await page.locator('.api-professional-card h3').textContent(),'Profissional '+(i+1));
  }
  check('Seis links da Home aplicam os seis filtros, sem inferir especialidade pela bio ou por Medicina');
  await page.goto(site+'/pages/profissionais.html?especialidade=PSIC%C3%93LOGA');
  await page.locator('.api-professional-card').first().waitFor();
  await page.locator('#searchInput').fill('são paulo');assert.equal(await page.locator('.api-professional-card').count(),1);
  await page.locator('#searchInput').fill('Campinas');assert.equal(await page.locator('.api-professional-card').count(),0);
  assert.match(await page.locator('#profissionaisStatus').textContent(),/Nenhum profissional de Psicólogos/);
  await page.locator('#limparFiltros').click();assert.equal(await page.locator('.api-professional-card').count(),people.length);
  for(const term of ['Profissional 2','Fonoaudiologia','Campinas']) {await page.locator('#searchInput').fill(term);assert((await page.locator('.api-professional-card').count())>0);}
  await page.goto(site+'/pages/profissionais.html?especialidade=inexistente');await page.locator('.api-professional-card').first().waitFor();
  assert.equal(await page.locator('.api-professional-card').count(),people.length);assert.match(await page.locator('#especialidadeInfo').textContent(),/não reconhecida/);
  check('Acentos, busca por nome/formação/cidade, combinação, ausência de resultados, filtro inválido e limpar filtros');
  for(const count of [0,1,2,3]) {
   articleData=articles.slice(0,count);await page.goto(site+'/index.html');await page.locator('#homeArtigos[aria-busy=false]').waitFor({state:'attached'});
   assert.equal(await page.locator('.card-artigo-home').count(),count);
   if(!count) assert.match(await page.locator('#homeArtigosStatus').textContent(),/Ainda não há/);
  }
  articleData=articles;delay=true;await page.goto(site+'/index.html');assert.match(await page.locator('#homeArtigosStatus').textContent(),/Carregando/);await page.locator('#homeArtigos[aria-busy=false]').waitFor({state:'attached'});delay=false;
  for(const mode of ['error','invalid']) {
   articleMode=mode;await page.goto(site+'/index.html');await page.locator('#homeArtigosRetry').waitFor();assert.equal(await page.locator('.card-artigo-home').count(),0);
   articleMode='ok';await page.locator('#homeArtigosRetry').click();await page.locator('.card-artigo-home').first().waitFor();
  }
  for(const mode of ['unauthorized','forbidden']) {articleMode=mode;await page.goto(site+'/index.html');await page.locator('#homeArtigos[aria-busy=false]').waitFor({state:'attached'});assert.equal(await page.locator('.card-artigo-home').count(),0);}
  articleMode='ok';
  check('Carregamento, zero a três artigos, falha, resposta inválida, tentar novamente e listagem restrita 401/403');
  const guest=await browser.newContext();
  await guest.addInitScript(({site})=>localStorage.setItem('espectrocare_api_base_url',site),{site});
  await guest.route('https://**/*',r=>r.abort());
  await guest.route('**/api/aprendizagem',r=>r.fulfill({json:articles}));
  const guestPage=await guest.newPage();guestPage.on('pageerror',e=>report.errors.push({message:e.message}));
  await guestPage.goto(site+'/index.html');await guestPage.locator('.card-artigo-home').first().waitFor();
  const guestHref=await guestPage.locator('.card-artigo-home').first().getAttribute('href');
  assert(guestHref.startsWith('/pages/login.html?redirect='));
  await guestPage.locator('.card-artigo-home').first().click();await guestPage.waitForURL('**/pages/login.html?redirect=**');
  assert.equal(new URL(guestPage.url()).searchParams.get('redirect'),'/pages/aprendizagemdoc1.html?id=41');
  await guest.close();
  sessionMode='expired';await page.goto(site+'/index.html');await page.locator('.card-artigo-home').first().waitFor();await page.locator('.card-artigo-home').first().click();await page.waitForURL('**/pages/login.html?redirect=**');sessionMode='ok';
  check('Visitante e sessão expirada vão ao login preservando o ID, sem liberar detalhes');
  await page.goto(site+'/pages/cadastro-profissional.html');
  await page.locator('#nomeProf').fill('Profissional Exemplo');
  await page.locator('#registroConselho').selectOption('crm');await page.locator('#registroUf').selectOption('SP');
  await page.locator('#registro').fill('1234567');assert.equal(await page.locator('#registro').getAttribute('maxlength'),'7');
  assert.equal(await page.locator('#registro').evaluate(el=>el.checkValidity()),true);
  await page.locator('#registro').fill('0000000');assert.equal(await page.locator('#registro').evaluate(el=>el.checkValidity()),false);
  await page.locator('#registro').fill('123A');assert.equal(await page.locator('#registro').evaluate(el=>el.checkValidity()),false);
  await page.locator('#registro').fill('1234567');
  assert.equal(await page.locator('.registro-consultar').count(),0);
  await page.locator('#registroConselho').selectOption('outro');await page.locator('#registro').fill('CRP 06/123456');
  assert.equal(await page.locator('#registro').getAttribute('maxlength'),'80');assert.equal(await page.locator('#registro').evaluate(el=>el.checkValidity()),true);assert.equal(await page.locator('.registro-consultar').count(),0);
  await page.goto(site+'/pages/userProfissional.html');await page.waitForFunction(()=>document.querySelector('#numRegistro').value==='1234567');
  assert.equal(await page.locator('#numRegistroConselho').inputValue(),'crm');assert.equal(await page.locator('#numRegistroUf').inputValue(),'SP');assert(await page.locator('#numRegistroProvisorio').isChecked());
  check('CRM limitado a sete dígitos, zero/letras rejeitados, cadastro sem consulta prévia, outro conselho preservado, perfil carrega CRM provisório');
  assert.equal(report.errors.length,0,JSON.stringify(report.errors));
  check('Sem novas exceções JavaScript nas páginas e fluxos testados');
 } finally {fs.writeFileSync(path.join(output,'relatorio.json'),JSON.stringify(report,null,2));await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
