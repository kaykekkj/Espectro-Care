const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname,'../assets/js/crm-verificacao.js'),'utf8');
class Element {
 constructor(tag) { this.tag=tag; this.children=[]; this.handlers={}; this.disabled=false; }
 append(...values) { this.children.push(...values); }
 replaceChildren(...values) { this.children=values; }
 setAttribute(key,value) { this[key]=value; }
 addEventListener(key,fn) { this.handlers[key]=fn; }
}
function setup(response={ok:true,status:200,json:async()=>({status:'EM_ANALISE'})}) {
 const calls=[], location={pathname:'/pages/area-usuario.html',search:'',assign(url){this.target=url;}};
 const context={window:{},document:{createElement:tag=>new Element(tag)},location,EspectroCareAuth:{
  authorizedFetch:async (path,options)=>{calls.push({path,options});return response;},clearSession(){calls.push('cleared');}}};
 vm.runInNewContext(source,context);
 return {api:context.window.EspectroCareCrm,calls,location};
}
const profile = {nome:'Nome de teste',numRegistro:'CRM-SP 1234567'};
test('CRM nunca fica verde por formato, dados ausentes ou data inválida',()=>{
 const {api}=setup();
 for(const p of [profile,{...profile,crmVerificacao:{status:'VERIFICADO'}},{...profile,crmVerificacao:{status:'VERIFICADO',conferidoEm:'inválido'}},{...profile,crmVerificacao:{status:'REGULAR'}}]){
  assert.equal(api.status(p),'PENDENTE');assert.equal(api.badge(p).textContent,'CRM não verificado');
 }
});
test('selo conferido informa data e escopo; CRP e registro legado não viram CRM',()=>{
 const {api}=setup();
 const badge=api.badge({...profile,crmVerificacao:{status:'VERIFICADO',conferidoEm:'2026-10-26T12:00:00Z'}});
 assert.equal(badge.textContent,'CRM conferido');assert.match(badge.title,/26\/10\/2026/);assert.match(badge.title,/manualmente/);
 for(const register of ['CRP 06/123456','21321321321321','']){
  assert.equal(api.status({...profile,numRegistro:register}),'NAO_APLICAVEL');
  assert.equal(api.badge({...profile,numRegistro:register}).textContent,'Registro não verificado');
 }
});
test('validar CRM usa sessão e registro salvo sem permitir autodeclaração',async()=>{
 const {api,calls}=setup(); const badge=new Element('div'),controls=new Element('div');
 api.bindOwner(profile,badge,controls);
 const button=controls.children.find(c=>c.tag==='button');
 assert.equal(button.textContent,'Validar CRM');assert.equal(calls.length,0);
 await button.handlers.click();
 assert.equal(calls[0].path,'/api/perfil/crm/solicitacao');assert.equal(calls[0].options.method,'POST');assert.equal(calls[0].options.body,undefined);
 assert.equal(badge.children[0].textContent,'CRM em análise');assert.equal(button.disabled,true);
});
test('perfil alterado exige salvar antes de enviar e não faz consulta paga',()=>{
 const {api,calls}=setup(); const badge=new Element('div'),controls=new Element('div');
 const view=api.bindOwner(profile,badge,controls);view.setDirty();
 assert.equal(controls.children.find(c=>c.tag==='button').disabled,true);
 assert.match(controls.children[0].textContent,/Salve as alterações/);assert.equal(calls.length,0);
});
test('falha e limite permitem tentar depois, sem criar selo',async()=>{
 for(const response of [{ok:false,status:429,json:async()=>({mensagem:'Aguarde 15 minutos.'})},{ok:false,status:500,json:async()=>{throw Error();}}]){
  const {api}=setup(response);const badge=new Element('div'),controls=new Element('div');api.bindOwner(profile,badge,controls);
  const button=controls.children.find(c=>c.tag==='button');await button.handlers.click();
  assert.equal(button.disabled,false);assert.equal(badge.children[0].textContent,'CRM não verificado');
  assert.match(controls.children[0].textContent,/Aguarde|Não foi possível/);
 }
});
test('sessão expirada retorna ao login com destino preservado',async()=>{
 const {api,calls,location}=setup({status:401,ok:false});const controls=new Element('div');api.bindOwner(profile,new Element('div'),controls);
 await controls.children.find(c=>c.tag==='button').handlers.click();assert(calls.includes('cleared'));assert.match(location.target,/login.html\?redirect=%2Fpages%2Farea-usuario.html/);
});
test('status pendente, em análise e não confirmado têm nomes claros',()=>{
 const {api}=setup();for(const [state,text] of [['PENDENTE','CRM não verificado'],['EM_ANALISE','CRM em análise'],['NAO_CONFIRMADO','CRM não confirmado']])
  assert.equal(api.badge({...profile,crmVerificacao:{status:state}}).textContent,text);
});
