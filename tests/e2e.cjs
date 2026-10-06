// Pré-requisitos: API exclusiva de testes e site local; nunca executar contra produção.
const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');

const api = process.env.TEST_API_URL || 'http://127.0.0.1:8088';
const site = process.env.TEST_SITE_URL || 'http://127.0.0.1:5500';
for (const url of [api, site]) assert(['127.0.0.1', 'localhost'].includes(new URL(url).hostname), 'Use somente servidores locais de testes.');
const adminEmail = 'admin-e2e@teste.invalid';
const password = 'Senha@123';
const suffix = Date.now().toString();
const output = process.env.TEST_OUTPUT_DIR || path.join(__dirname, 'resultados');
fs.mkdirSync(output, { recursive: true });
const checks = [];
const check = name => { checks.push(name); console.log('OK:', name); };
async function request(route, method = 'GET', body, token) {
    const response = await fetch(api + route, { method, headers: {
        ...(body ? { 'Content-Type': 'application/json' } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {})
    }, body: body ? JSON.stringify(body) : undefined });
    let data; try { data = await response.json(); } catch {}
    return { status: response.status, data };
}
async function session(browser, user) {
    const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    context.setDefaultTimeout(60000);
    await context.addInitScript(({ api, user }) => {
        localStorage.setItem('espectrocare_api_base_url', api);
        if (user) { localStorage.setItem('token', user.token); localStorage.setItem('email', user.email); }
    }, { api, user });
    return { context, page: await context.newPage() };
}
async function responsive(page, route, name) {
    for (const width of [1280, 375]) {
        await page.setViewportSize({ width, height: 900 }); await page.goto(site + route);
        await page.waitForTimeout(500);
        assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `${name}: overflow em ${width}px`);
        await page.screenshot({ path: path.join(output, `${name}-${width}.png`), fullPage: true });
    }
}
(async () => {
    let login = await request('/auth/login', 'POST', { email: adminEmail, senha: password });
    if (login.status !== 200) {
        assert(process.env.TEST_INVITE_FILE, 'Defina TEST_INVITE_FILE com o arquivo privado do primeiro convite de testes.');
        const link = fs.readFileSync(process.env.TEST_INVITE_FILE, 'utf8').trim();
        const browser = await chromium.launch({ headless: true, ...(process.env.TEST_BROWSER_PATH ? { executablePath: process.env.TEST_BROWSER_PATH } : {}) });
        try {
            const { page } = await session(browser);
            // Substitui apenas a origem; o fragmento original permanece no link local.
            await page.goto(site + new URL(link).pathname + new URL(link).hash);
            await page.locator('#cadastroAdmin').waitFor({ state: 'visible' });
            assert.equal(await page.locator('#email').inputValue(), adminEmail);
            assert.equal(new URL(page.url()).hash, '');
            await page.locator('#nome').fill('Administrador de teste'); await page.locator('#senha').fill(password);
            await page.locator('#cadastroAdmin button').click();
            await page.getByText('Administrador cadastrado com sucesso.', { exact: false }).waitFor();
            check('Cadastro administrativo pela página de convite; token removido do histórico');
        } finally { await browser.close(); }
        login = await request('/auth/login', 'POST', { email: adminEmail, senha: password });
    }
    assert.equal(login.status, 200); const adminToken = login.data.token;
    const browser = await chromium.launch({ headless: true, ...(process.env.TEST_BROWSER_PATH ? { executablePath: process.env.TEST_BROWSER_PATH } : {}) });
    try {
        const { page: admin } = await session(browser);
        await admin.goto(site + '/pages/login.html'); await admin.locator('#email').fill(adminEmail); await admin.locator('#senha').fill(password);
        await admin.locator('#btnLogar').click(); await admin.waitForURL('**/admin.html', { waitUntil: 'domcontentloaded' });
        await admin.locator('#adminConteudo').waitFor({ state: 'visible' }); check('Login administrativo e painel de convites');
        await admin.locator('#email').fill(`convidado-${suffix}@teste.invalid`); await admin.locator('#gerarConvite button').click();
        await admin.locator('#novoConvite').waitFor({ state: 'visible' });
        const link = await admin.locator('#linkConvite').inputValue(); assert(new URL(link).hash.startsWith('#token='));
        const row = admin.locator('.admin-row').filter({ hasText: `convidado-${suffix}@teste.invalid` });
        admin.once('dialog', dialog => dialog.accept()); await row.getByRole('button', { name: 'Revogar' }).click();
        await row.getByText('Revogado', { exact: false }).waitFor();
        const inviteToken = new URLSearchParams(new URL(link).hash.slice(1)).get('token');
        assert.equal((await request('/cadastro/admin/convite/validar', 'POST', { token: inviteToken })).status, 400);
        check('Emissão de convite, link copiável e revogação pela interface');

        await admin.goto(site + '/pages/aprendizagem.html'); await admin.locator('#novaPostagem').waitFor({ state: 'visible' });
        await admin.locator('#novaPostagem').click(); await admin.locator('#postagemTitulo').fill(`Artigo E2E ${suffix}`);
        await admin.locator('#postagemConteudo').fill('<p>Conteúdo persistente de teste</p>'); await admin.locator('#formPostagem [type=submit]').click();
        const card = admin.locator('.api-learning-card').filter({ hasText: `Artigo E2E ${suffix}` }); await card.waitFor();
        await card.getByRole('button', { name: 'Editar', exact: false }).click(); await admin.locator('#postagemTitulo').fill(`Artigo editado ${suffix}`);
        await admin.locator('#formPostagem [type=submit]').click();
        const edited = admin.locator('.api-learning-card').filter({ hasText: `Artigo editado ${suffix}` }); await edited.waitFor();
        admin.once('dialog', dialog => dialog.dismiss()); await edited.getByRole('button', { name: 'Excluir', exact: false }).click();
        assert.equal(await edited.count(), 1);
        admin.once('dialog', dialog => dialog.accept()); await edited.getByRole('button', { name: 'Excluir', exact: false }).click();
        await edited.waitFor({ state: 'detached' }); check('Criação, edição, confirmação cancelada e exclusão de postagem');

        for (const role of ['responsavel', 'profissional']) {
            const email = `${role}-${suffix}@teste.invalid`;
            assert.equal((await request('/cadastro/' + role, 'POST', { nome: `Teste ${role}`, email, senha: password,
                ...(role === 'profissional' ? { cpf: suffix.slice(-11), telefone: '11987654321', numRegistro: 'REG-E2E', formacao: 'Psicologia' } : {}) })).status, 200);
            const user = (await request('/auth/login', 'POST', { email, senha: password })).data;
            const { page } = await session(browser, user);
            await page.goto(site + '/pages/area-usuario.html'); await page.locator('#areaUsuarioConteudo').waitFor({ state: 'visible' });
            await page.locator('input[type=file]').setInputFiles(path.join(__dirname, 'foto-teste.png'));
            await page.getByText('Foto de perfil atualizada com sucesso.').waitFor();
            await page.locator('.auth-user-avatar img').waitFor();
            await page.reload(); await page.locator('.auth-user-avatar img').waitFor();
            await page.goto(site + '/index.html'); await page.locator('.auth-user-avatar img').waitFor();
            assert.equal((await request('/api/aprendizagem', 'POST', { titulo: 'Proibido', conteudoHtml: '<p>x</p>' }, user.token)).status, 403);
            await page.goto(site + '/pages/aprendizagem.html'); assert.equal(await page.locator('#adminAprendizagem').isVisible(), false);
            const newLogin = (await request('/auth/login', 'POST', { email, senha: password })).data;
            assert((await request('/api/conta/foto', 'GET', undefined, newLogin.token)).data.fotoPerfil.startsWith('data:image/jpeg'));
            check(`Foto de ${role} persistente, ícone atualizado, novo login e acesso administrativo negado`);
            if (role === 'profissional') {
                const me = (await request('/api/auth/me', 'GET', undefined, user.token)).data;
                await page.goto(site + '/pages/profissionais.html');
                const card = page.locator(`.api-professional-card:has(a[href="perfil-profissional.html?id=${me.id}"])`); await card.waitFor();
                await card.locator('.api-professional-avatar img').waitFor();
                assert(!(await card.innerText()).includes('REG-E2E')); assert(!(await card.innerText()).includes('98765'));
                const button = card.locator('.btn-ver-perfil');
                for (const state of ['normal', 'hover', 'focus']) {
                    if (state === 'hover') await button.hover(); if (state === 'focus') await button.focus();
                    assert.equal(await button.evaluate(el => getComputedStyle(el).textDecorationLine), 'none');
                }
                assert.equal(await button.evaluate(el => getComputedStyle(el).outlineStyle), 'solid');
                await page.goto(site + `/pages/perfil-profissional.html?id=${me.id}`); await page.locator('.api-profile-avatar img').waitFor();
                assert((await page.locator('#profileCard').innerText()).includes('REG-E2E'));
                assert((await page.locator('#profileCard').innerText()).includes('98765'));
                await page.goto(site + '/pages/userProfissional.html'); await page.locator('#fotoPerfilAvatar img').waitFor();
                check('Foto no card, perfil e gestão; números somente no perfil; Ver perfil sem sublinhado e com foco');
                await responsive(page, '/pages/profissionais.html', 'profissionais');
                await responsive(page, `/pages/perfil-profissional.html?id=${me.id}`, 'perfil-profissional');
            }
        }
        await responsive(admin, '/pages/admin.html', 'convites'); await responsive(admin, '/pages/aprendizagem.html', 'aprendizagem');
        await admin.goto(site + '/pages/cadastro-admin.html#token=invalido');
        await admin.getByText('Convite inválido', { exact: false }).waitFor(); assert.equal(await admin.locator('#cadastroAdmin').isVisible(), false);
        await responsive(admin, '/pages/cadastro-admin.html', 'cadastro-admin'); check('Convite inválido e responsividade em 375/1280 px');
        fs.writeFileSync(path.join(output, 'relatorio.json'), JSON.stringify({ checks, status: 'aprovado' }, null, 2));
    } finally { await browser.close(); }
})().catch(error => { console.error(error.message); process.exitCode = 1; });
