// Homologação local com API simulada; nunca envia registros ao CFM ou produção.
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const site = process.env.TEST_SITE_URL || 'http://127.0.0.1:5517';
assert(['localhost','127.0.0.1'].includes(new URL(site).hostname));
(async () => {
 const browser = await chromium.launch({headless:true,...(process.env.TEST_BROWSER_PATH?{executablePath:process.env.TEST_BROWSER_PATH}: {})});
 try {
  const context = await browser.newContext();
  const user = {id:'1',nome:'Nome de teste',email:'crm@example.invalid',tipoPerfil:'PROFISSIONAL'};
  let role = 'PROFISSIONAL', state = 'PENDENTE', requests = 0;
  const profile = () => ({...user,numRegistro:'CRM-SP 1234567',formacao:'Psiquiatria',estado:'SP',cidade:'São Paulo',crmVerificacao:{status:state,conferidoEm:state==='VERIFICADO'?'2026-10-26T12:00:00Z':null}});
  await context.addInitScript(site=>{localStorage.setItem('espectrocare_api_base_url',site);localStorage.setItem('token','token-sintetico');},site);
  await context.route('https://**/*',r=>r.abort());
  await context.route('**/api/**',async route=>{
   const p=new URL(route.request().url()).pathname;
   if(p==='/api/auth/me')return route.fulfill({json:{...user,tipoPerfil:role}});
   if(p==='/api/perfil/crm/solicitacao'){requests++;state='EM_ANALISE';return route.fulfill({json:{status:state}});}
   if(p==='/api/perfil')return route.fulfill({json:profile()});
   if(p==='/api/profissionais')return route.fulfill({json:[profile()]});
   if(p==='/api/profissionais/1')return route.fulfill({json:profile()});
   if(p==='/api/admin/convites')return route.fulfill({json:[]});
   if(p==='/api/admin/crm/solicitacoes')return route.fulfill({json:{content:state==='EM_ANALISE'?[{id:1,nome:user.nome,numRegistro:'CRM-SP 1234567',revisao:1,solicitadoEm:'2026-10-26T12:00:00Z'}]:[],last:true,totalPages:1}});
   if(p==='/api/admin/crm/solicitacoes/1'){state=route.request().postDataJSON().confirmado?'VERIFICADO':'NAO_CONFIRMADO';return route.fulfill({json:{status:state}});}
   return route.fulfill({json:{}});
  });
  const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(site+'/pages/area-usuario.html');await page.locator('#areaUsuarioCrm .crm-validate').waitFor();
  assert.equal(await page.locator('#areaUsuarioCrmBadge').innerText(),'CRM não verificado');
  await page.getByRole('button',{name:'Validar CRM',exact:true}).click();await page.getByRole('button',{name:'Validação solicitada'}).waitFor();assert.equal(requests,1);
  await page.goto(site+'/pages/profissionais.html');await page.locator('.api-professional-meta .crm-badge').waitFor();
  assert.match(await page.locator('.api-professional-meta').innerText(),/Psiquiatria[\s\S]*CRM em análise[\s\S]*São Paulo/);
  await page.goto(site+'/pages/perfil-profissional.html?id=1');await page.locator('.api-profile-crm').waitFor();
  assert.equal(await page.locator('.header-info').evaluate(el=>el.querySelector('.api-profile-crm').compareDocumentPosition(el.querySelector('.api-profile-register')) & Node.DOCUMENT_POSITION_FOLLOWING),4);
  role='ADMIN';await page.goto(site+'/pages/admin.html');await page.locator('#listaCrm .admin-row').waitFor();
  assert.equal(await page.getByRole('button',{name:'Confirmar CRM',exact:true}).isEnabled(),false);
  await page.locator('.crm-confirm-check').check();await page.getByRole('button',{name:'Confirmar CRM',exact:true}).click();await page.locator('#listaCrm .admin-row').waitFor({state:'detached'});
  role='PROFISSIONAL';await page.goto(site+'/pages/area-usuario.html');await page.getByRole('button',{name:'CRM conferido',exact:true}).waitFor();
  for(const width of [1440,1024,768,480,390,360]) {
   await page.setViewportSize({width,height:900});
   for(const path of ['/pages/area-usuario.html','/pages/profissionais.html','/pages/perfil-profissional.html?id=1']){
    await page.goto(site+path);await page.locator('.crm-badge').first().waitFor();
    await page.addStyleTag({content:'html,body{overflow-x:visible!important}'});
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),path+' overflow @'+width);
   }
  }
  assert.deepEqual(errors,[]);console.log('CRM e2e OK: solicitação, selo, posições, aprovação e seis larguras.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
