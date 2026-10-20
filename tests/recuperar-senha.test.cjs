const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const script = fs.readFileSync(path.join(__dirname, '../assets/js/recuperar-senha.js'), 'utf8');
async function setup(profile) {
    const calls = [], elements = {}, feedback = [], state = { cleared: false };
    for (const id of ['resetEmail','resetCode','newPassword','confirmPassword','resetFeedback','requestReset','confirmReset','passwordBack','resetLogin']) {
        elements[id] = { value: '', hidden: false, handlers: {}, validity: '', button: {},
            addEventListener(name, handler) { this.handlers[name] = handler; },
            setCustomValidity(value) { this.validity = value; },
            querySelector() { return this.button; },
            reportValidity() { return !this.validity; },
            reset() { state.reset = true; } };
    }
    const response = { ok: true, status: 200, json: async () => ({ mensagem: 'Operação aceita.' }) };
    const context = {
        document: { getElementById: id => elements[id] }, location: { search: profile ? '?origem=perfil' : '' },
        URLSearchParams, TextEncoder,
        EspectroCareConfig: { API_BASE_URL: 'https://api.test' },
        EspectroCareForms: { isStrongPassword: value => value === 'NovaSenha@123', setFeedback: (el, message, type) => feedback.push({message, type}) },
        EspectroCareAuth: {
            requireAuth: async () => ({ email: 'perfil@example.com', tipoPerfil: 'RESPONSAVEL' }),
            profilePage: () => 'userResponsavel.html',
            authorizedFetch: async (url, options) => { calls.push({url,options,authorized:true}); return response; },
            clearSession: () => { state.cleared = true; }
        },
        fetch: async (url, options) => { calls.push({url,options,authorized:false}); return response; }
    };
    await vm.runInNewContext(script, context);
    return { elements, calls, state, feedback };
}
const submit = element => element.handlers.submit({preventDefault(){}});
test('perfil fixa destinatário da API e solicita sem e-mail no corpo', async () => {
    const {elements,calls} = await setup(true);
    assert.equal(elements.resetEmail.value, 'perfil@example.com');
    assert.equal(elements.resetEmail.readOnly, true);
    await submit(elements.requestReset);
    assert.equal(calls[0].url, '/api/conta/recuperacao-senha');
    assert.equal(calls[0].authorized, true);
    assert.equal(calls[0].options.body, undefined);
});
test('login usa rota pública e após confirmação limpa a sessão e esconde formulários', async () => {
    const {elements,calls,state} = await setup(false);
    elements.resetEmail.value = ' conta@example.com ';
    await submit(elements.requestReset);
    assert.equal(calls[0].url, 'https://api.test/auth/esqueci-senha');
    assert.deepEqual(JSON.parse(calls[0].options.body), {email:'conta@example.com'});
    elements.resetCode.value = '01234567'; elements.newPassword.value = 'NovaSenha@123'; elements.confirmPassword.value = 'NovaSenha@123';
    await submit(elements.confirmReset);
    assert.equal(calls[1].url, 'https://api.test/auth/redefinir-senha');
    assert.deepEqual(JSON.parse(calls[1].options.body), {email:'conta@example.com',codigo:'01234567',novaSenha:'NovaSenha@123'});
    assert.equal(state.cleared, true);
    assert.equal(elements.confirmReset.hidden, true);
    assert.equal(elements.requestReset.hidden, true);
    assert.equal(elements.resetLogin.hidden, false);
});
test('confirmação divergente impede envio da redefinição', async () => {
    const {elements,calls} = await setup(false);
    elements.newPassword.value = 'NovaSenha@123'; elements.confirmPassword.value = 'OutraSenha@123';
    // reportValidity real avalia todos os controles; reproduz essa fronteira do formulário.
    elements.confirmReset.reportValidity = () => !elements.newPassword.validity && !elements.confirmPassword.validity;
    await submit(elements.confirmReset);
    assert.equal(calls.length, 0);
    assert.equal(elements.confirmPassword.validity, 'As senhas não coincidem.');
});
