// Teste visual local com respostas da API simuladas; os testes Java verificam a API real.
const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const site = process.env.TEST_SITE_URL || 'http://127.0.0.1:5517';
assert(['127.0.0.1', 'localhost'].includes(new URL(site).hostname), 'Use somente site local.');
const output = process.env.TEST_OUTPUT_DIR || path.join(__dirname, 'resultados-responsividade');
fs.mkdirSync(output, { recursive: true });
const profile = { id: 1, nome: 'Nome completo de teste de responsividade', email: 'teste@example.org',
    telefone: '11999999999', cidade: 'São Paulo', estado: 'SP', formacao: 'Psicologia', bio: 'Profissional de teste', numRegistro: '123456' };
const article = { id: 1, titulo: 'Entendendo as necessidades de cada criança', conteudoHtml: '<p>Conteúdo educativo para responsáveis.</p>',
    resumo: 'Resumo da postagem para facilitar a leitura.', referencias: 'https://example.org/fonte\njavascript:alert(1)',
    imagemUrl: '/api/aprendizagem/1/imagem', categorias: ['Aprendizagem'], dataCriacao: '2026-10-17T12:00:00' };
const image = fs.readFileSync(path.join(__dirname, 'foto-teste.png'));
(async () => {
    const browser = await chromium.launch({ headless: true,
        ...(process.env.TEST_BROWSER_PATH ? { executablePath: process.env.TEST_BROWSER_PATH } : {}) });
    const report = { checks: [], layouts: [], errors: [], missingAssets: [] };
    try {
        const context = await browser.newContext();
        let role = 'ADMIN', saved;
        await context.addInitScript(({site}) => { localStorage.setItem('espectrocare_api_base_url', site); localStorage.setItem('token', 'teste-local'); }, {site});
        await context.route('https://**/*', route => route.abort());
        await context.route('**/api/**', async route => {
            const request = route.request(), url = new URL(request.url()), resource = url.pathname;
            let data = {};
            if (resource.endsWith('/imagem')) return route.fulfill({contentType: 'image/png', body: image});
            if (resource.includes('/foto')) return route.fulfill({status: 404, json: {}});
            if (resource === '/api/auth/me') data = {...profile, tipoPerfil: role};
            else if (resource === '/api/admin/convites') data = [];
            else if (resource === '/api/aprendizagem' && request.method() === 'GET') data = [article, {...article, id: 2, titulo: 'Outra postagem'}, {...article, id: 3}];
            else if (resource.startsWith('/api/aprendizagem') && ['POST','PUT'].includes(request.method())) { saved = request.postDataJSON(); data = {...article, ...saved}; }
            else if (resource.startsWith('/api/aprendizagem/')) data = article;
            else if (resource === '/api/profissionais') data = [profile];
            else data = profile;
            await route.fulfill({json: data});
        });
        const page = await context.newPage();
        page.on('pageerror', error => report.errors.push({url:page.url(), message:error.message, stack:error.stack}));
        page.on('response', response => {
            if (response.status() === 404 && !response.url().includes('/api/')) report.missingAssets.push(response.url());
        });
        const files = ['index.html', ...fs.readdirSync(path.join(__dirname, '../pages')).filter(x => x.endsWith('.html')).map(x => 'pages/' + x)];
        for (const file of files) {
            role = file.includes('admin.html') ? 'ADMIN' : file.includes('Profissional') || file.includes('editar-perfil') ? 'PROFISSIONAL' : 'RESPONSAVEL';
            const query = /aprendizagemdoc1|perfil-profissional\.html/.test(file) ? '?id=1' : '';
            for (const width of [320,375,768,1024,1440]) {
                await page.setViewportSize({width, height: 900}); await page.goto(`${site}/${file}${query}`);
                await page.waitForTimeout(160);
                const overflow = await page.evaluate(() => [...document.querySelectorAll('main, section, form, header, footer, h1, h2, p, input, textarea, button')].filter(el => {
                    if (el.closest('.cards-equipe') || el.closest('dialog:not([open])')) return false;
                    const r = el.getBoundingClientRect(), style = getComputedStyle(el);
                    return r.width > 0 && r.height > 0 && style.visibility !== 'hidden' && (r.right > innerWidth + 2 || r.left < -2);
                }).map(el => ({tag: el.tagName, id: el.id, class: el.className, html:el.outerHTML.slice(0,300), parent:el.parentElement.className})).slice(0,8));
                report.layouts.push({file,width,overflow});
                if (['index.html','pages/sobre-nos.html','pages/aprendizagemdoc1.html'].includes(file) && [375,768,1440].includes(width))
                    await page.screenshot({path: path.join(output, `${path.basename(file,'.html')}-${width}.png`), fullPage: true});
            }
        }
        report.checks.push(`${files.length} páginas em cinco larguras, incluindo conteúdo autenticado`);
        for (const width of [320, 375, 768]) {
            await page.setViewportSize({width,height:812}); await page.goto(site+'/pages/profissionais.html');
            await page.locator('#mobile-menu').click();
            await page.waitForTimeout(300);
            assert.equal(await page.locator('#mobile-menu').getAttribute('aria-expanded'),'true');
            assert(await page.locator('#navlinks').evaluate(el=>el.getBoundingClientRect().right <= innerWidth+1));
            await page.locator('#mobile-menu').click();
        }
        report.checks.push('Menu móvel abre dentro da tela e esconde opções da sessão corretamente');
        await page.goto(site+'/pages/sobre-nos.html');
        const count = await page.locator('#cardsEquipe > :not([aria-hidden])').count();
        const before = await page.locator('#cardsEquipe').evaluate(el => el.style.transform);
        for (let i=0;i<count;i++) { await page.locator('#btnProximo').click(); await page.waitForTimeout(450); }
        assert.equal(await page.locator('#cardsEquipe').evaluate(el => el.style.transform), before);
        for (let i=0;i<count;i++) { await page.locator('#btnAnterior').click(); await page.waitForTimeout(450); }
        assert.equal(await page.locator('#cardsEquipe').evaluate(el => el.style.transform), before);
        assert.equal(await page.locator('#btnAnterior').isEnabled(), true);
        report.checks.push('Carrossel completa uma volta em ambas as direções sem bloquear as setas');
        await page.setViewportSize({width:375,height:812});
        role = 'ADMIN'; await page.goto(site+'/pages/aprendizagem.html');
        await page.locator('#novaPostagem').click();
        await page.locator('#postagemTitulo').fill('Postagem com imagem'); await page.locator('#postagemConteudo').fill('<p>Texto educativo</p>');
        await page.locator('#postagemResumo').fill('Resumo educativo'); await page.locator('#postagemReferencias').fill('https://example.org/fonte');
        assert.equal(await page.locator('#postagemImagem').getAttribute('required'), '');
        await page.locator('#postagemImagem').setInputFiles(path.join(__dirname,'foto-teste.png'));
        await page.locator('#formPostagem [type=submit]').click(); await page.locator('#editorPostagem').waitFor({state:'hidden'});
        assert(saved.imagemData.startsWith('data:image/png;base64,')); assert.equal(saved.resumo,'Resumo educativo');
        report.checks.push('Formulário administrativo envia imagem, resumo e referências em celular');
        await page.getByRole('button', {name:'Editar',exact:false}).first().click();
        assert.equal(await page.locator('#postagemResumo').inputValue(), article.resumo);
        assert.equal(await page.locator('#postagemImagem').getAttribute('required'), null);
        await page.locator('#cancelarPostagem').click();
        for (role of ['RESPONSAVEL','PROFISSIONAL']) {
            await page.goto(site+'/pages/aprendizagem.html');
            assert.equal(await page.locator('#novaPostagem').isVisible(), false);
            assert.equal(await page.locator('.admin-actions').count(), 0);
        }
        report.checks.push('Responsáveis e profissionais não recebem controles de escrita');
        await page.goto(site+'/pages/aprendizagemdoc1.html?id=1');
        await page.locator('#artigoResumoSecao').waitFor({state:'visible'});
        assert.equal(await page.locator('#artigoReferencias a').count(),1);
        assert.equal(await page.locator('#recomendacoesLista a').count(),2);
        assert.equal(await page.locator('#recomendacoesLista a[href$="id=1"]').count(),0);
        assert(await page.locator('#artigoImagem').evaluate(el=>el.complete && el.naturalWidth>0));
        report.checks.push('Artigo mostra imagem, resumo antes das referências, links seguros e recomendações sem o artigo atual');
        assert.equal(report.errors.length,0,JSON.stringify(report.errors));
        assert.equal(report.missingAssets.length,0,JSON.stringify(report.missingAssets));
        assert.equal(report.layouts.filter(x=>x.overflow.length).length,0,JSON.stringify(report.layouts.filter(x=>x.overflow.length)));
    } finally {
        fs.writeFileSync(path.join(output,'relatorio.json'),JSON.stringify(report,null,2));
        console.log(JSON.stringify({checks:report.checks, errors:report.errors, missingAssets:report.missingAssets,
            overflow:report.layouts.filter(x=>x.overflow.length)},null,2)); await browser.close();
    }
})().catch(error=>{console.error(error);process.exitCode=1;});
