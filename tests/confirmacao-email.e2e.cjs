// Servidor local e API inteiramente simulada: não envia mensagens nem cadastra usuários reais.
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const root = path.resolve(__dirname, '..');
const server = http.createServer((req, res) => {
    const arquivo = path.resolve(root, '.' + new URL(req.url, 'http://localhost').pathname);
    if (!arquivo.startsWith(root + path.sep) || !fs.existsSync(arquivo) || !fs.statSync(arquivo).isFile()) { res.writeHead(404).end(); return; }
    const tipo = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8' }[path.extname(arquivo)];
    res.setHeader('Content-Type', tipo || 'application/octet-stream'); fs.createReadStream(arquivo).pipe(res);
});

(async () => {
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    const site = `http://127.0.0.1:${server.address().port}`;
    const api = 'http://127.0.0.1:9';
    const browser = await chromium.launch({ headless: true,
        ...(process.env.BROWSER_EXECUTABLE ? { executablePath: process.env.BROWSER_EXECUTABLE } : {}), args: ['--no-sandbox'] });
    try {
        for (const perfil of ['responsavel', 'profissional']) {
            const context = await browser.newContext({ viewport: { width: 375, height: 850 } });
            const enviados = [];
            let rejeitarCodigo = true;
            await context.addInitScript(api => {
                localStorage.setItem('espectrocare_api_base_url', api);
                const agora = Date.now; window.tempoTeste = 0; Date.now = () => agora() + window.tempoTeste;
            }, api);
            await context.route('**/*', async route => {
                const url = route.request().url();
                if (url.startsWith(api + '/')) {
                    const body = route.request().postDataJSON(); enviados.push({ path: new URL(url).pathname, body });
                    let status = 200;
                    if (!url.endsWith('/email/solicitar') && rejeitarCodigo) { status = 422; rejeitarCodigo = false; }
                    return route.fulfill({ status, contentType: 'application/json', body: '{}' });
                }
                if (url.startsWith('https://servicodados.ibge.gov.br/')) return route.fulfill({
                    contentType: 'application/json', body: JSON.stringify(url.includes('/municipios') ? [{ id: 3550308, nome: 'São Paulo' }] : [{ id: 35, nome: 'São Paulo', sigla: 'SP' }])
                });
                if (url.startsWith(site)) return route.continue();
                return route.abort();
            });
            const page = await context.newPage();
            const erros = []; page.on('pageerror', e => erros.push(e.message));
            await page.goto(`${site}/pages/cadastro-${perfil}.html`);
            const profissional = perfil === 'profissional';
            await page.locator(profissional ? '#nomeProf' : '#nome').fill('Pessoa de teste');
            await page.locator(profissional ? '#emailProf' : '#email').fill('pessoa@teste.invalid');
            await page.locator(profissional ? '#telProf' : '#tel').fill('11987654321');
            await page.locator('#cpf').fill('52998224725');
            await page.locator('#estado').fill('São Paulo');
            await page.getByRole('option', { name: 'São Paulo - SP', exact: true }).click();
            await page.locator('#cidade').fill('São Paulo');
            await page.getByRole('option', { name: 'São Paulo', exact: true }).click();
            if (profissional) { await page.locator('#formacao').fill('Psicologia'); await page.locator('#registro').fill('REG-E2E'); }
            await page.locator(profissional ? '#senhaProf' : '#senha').fill('Senha@123');
            await page.locator(profissional ? '#confirmarSenhaProf' : '#confirmarSenha').fill('Senha@123');
            await page.getByRole('button', { name: 'Cadastrar', exact: true }).click();
            const dialog = page.getByRole('dialog');
            await dialog.waitFor();
            await page.locator('[data-confirmar]:enabled').waitFor();
            assert.deepEqual(enviados, [{ path: '/cadastro/email/solicitar', body: { email: 'pessoa@teste.invalid' } }]);
            assert.equal(await page.locator('[data-reenviar]').isDisabled(), true);
            assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
            await page.setViewportSize({ width: 1280, height: 900 });
            assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
            await page.setViewportSize({ width: 375, height: 850 });
            const codigo = page.locator('#codigoConfirmacaoEmail');
            await codigo.fill('abc01234567xyz'); assert.equal(await codigo.inputValue(), '01234');
            await codigo.fill('01234567');
            await page.locator('[data-confirmar]').click();
            await page.getByText('E-mail não confirmado.', { exact: false }).waitFor();
            assert.equal(await dialog.isVisible(), true);
            assert.equal(enviados[1].body.codigoEmail, '01234567');
            assert.equal(await codigo.inputValue(), '');
            assert.equal(await page.evaluate(() => JSON.stringify({ ...localStorage, ...sessionStorage }).includes('Senha@123')), false);
            await page.evaluate(() => { window.tempoTeste += 61000; });
            await page.locator('[data-reenviar]:enabled').waitFor();
            await page.locator('[data-reenviar]').click();
            await page.locator('[data-confirmar]:enabled').waitFor();
            assert.equal(enviados.filter(x => x.path.endsWith('/email/solicitar')).length, 2);
            await page.locator('[data-corrigir]').click();
            assert.equal(await page.locator('dialog').count(), 0);
            const email = page.locator(profissional ? '#emailProf' : '#email');
            await email.fill('corrigido@teste.invalid');
            await page.getByRole('button', { name: 'Cadastrar', exact: true }).click();
            await page.locator('[data-confirmar]:enabled').waitFor();
            assert.equal(enviados.at(-1).body.email, 'corrigido@teste.invalid');
            await codigo.fill('07654321');
            const bounds = await dialog.boundingBox();
            assert(bounds.y >= 0 && bounds.x >= 0 && bounds.y + bounds.height <= 851 && bounds.x + bounds.width <= 376, 'Diálogo deve permanecer inteiro na viewport');
            if (process.env.TEST_SCREENSHOT_DIR) {
                fs.mkdirSync(process.env.TEST_SCREENSHOT_DIR, { recursive: true });
                await page.screenshot({ path: path.join(process.env.TEST_SCREENSHOT_DIR, `confirmacao-${perfil}-375.png`) });
            }
            await page.locator('[data-confirmar]').click();
            await page.getByText('Cadastro realizado com sucesso.', { exact: false }).waitFor();
            assert.equal(enviados.at(-1).path, `/cadastro/${perfil}`);
            assert.equal(enviados.at(-1).body.email, 'corrigido@teste.invalid');
            assert.equal(enviados.at(-1).body.codigoEmail, '07654321');
            assert.deepEqual(erros, []);
            await context.close();
            console.log(`OK: ${perfil}, confirmação, erro, reenvio, correção de e-mail e cadastro em celular`);
        }
    } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => server.close());
