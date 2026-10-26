(function () {
    const officialUrl = 'https://portal.cfm.org.br/busca-medicos/';
    const labels = { PENDENTE: 'CRM não verificado', EM_ANALISE: 'CRM em análise', VERIFICADO: 'CRM conferido', NAO_CONFIRMADO: 'CRM não confirmado', NAO_APLICAVEL: 'Registro não verificado' };
    function status(profile) {
        if (!/^CRM/i.test(String(profile.numRegistro || '').trim())) return 'NAO_APLICAVEL';
        const state = profile.crmVerificacao?.status;
        if (state === 'VERIFICADO' && !Number.isFinite(Date.parse(profile.crmVerificacao?.conferidoEm))) return 'PENDENTE';
        return Object.hasOwn(labels, state) && state !== 'NAO_APLICAVEL' ? state : 'PENDENTE';
    }
    function badge(profile) {
        const state = status(profile);
        const element = document.createElement('span');
        element.className = 'crm-badge crm-' + state.toLowerCase();
        element.textContent = labels[state];
        element.title = state === 'VERIFICADO'
            ? 'Nome, número, UF e situação conferidos manualmente no CFM em ' + new Date(profile.crmVerificacao.conferidoEm).toLocaleDateString('pt-BR') + '. Não comprova a identidade do titular da conta nem título de especialista.'
            : state === 'NAO_APLICAVEL' ? 'Este registro não foi identificado como CRM. Outros conselhos exigem consulta própria.'
            : 'A plataforma ainda não confirmou este CRM. Isso não significa que o registro seja falso.';
        return element;
    }
    function bindOwner(profile, badgeHost, controls) {
        let dirty = false;
        badgeHost.replaceChildren(badge(profile));
        controls.replaceChildren();
        if (status(profile) === 'NAO_APLICAVEL') return { setDirty() {} };
        const message = document.createElement('p'); message.className = 'crm-help';
        message.setAttribute('role', 'status'); message.setAttribute('aria-live', 'polite');
        const button = document.createElement('button'); button.type = 'button'; button.className = 'crm-validate';
        const link = document.createElement('a'); link.href = officialUrl; link.target = '_blank'; link.rel = 'noopener noreferrer';
        link.textContent = 'Consultar no portal oficial do CFM (nova aba)';
        const edit = document.createElement('a'); edit.href = 'userProfissional.html'; edit.textContent = 'Corrigir nome ou registro no perfil';
        function render() {
            const state = status(profile);
            badgeHost.replaceChildren(badge(profile));
            button.textContent = state === 'EM_ANALISE' ? 'Validação solicitada' : state === 'VERIFICADO' ? 'CRM conferido' : 'Validar CRM';
            button.disabled = dirty || ['EM_ANALISE', 'VERIFICADO'].includes(state);
            message.textContent = dirty ? 'Salve as alterações do perfil antes de solicitar a validação.'
                : state === 'EM_ANALISE' ? 'Pedido recebido. A equipe vai conferir seu nome, número, UF e situação no portal do CFM. Seu cadastro continua disponível.'
                : state === 'VERIFICADO' ? badge(profile).title
                : state === 'NAO_CONFIRMADO' ? 'A equipe não confirmou os dados. Confira nome e CRM/UF, corrija se necessário e solicite uma nova análise. Seu cadastro continua disponível.'
                : 'Seu CRM ainda não foi verificado. Solicite a conferência gratuita pela equipe. A consulta é manual e não impede o uso da conta.';
        }
        button.addEventListener('click', async () => {
            button.disabled = true; message.textContent = 'Enviando pedido de validação...';
            try {
                const response = await EspectroCareAuth.authorizedFetch('/api/perfil/crm/solicitacao', { method: 'POST', cache: 'no-store' });
                if (response.status === 401) { EspectroCareAuth.clearSession(); location.assign('login.html?redirect=' + encodeURIComponent(location.pathname + location.search)); return; }
                const data = await response.json().catch(() => null);
                if (!response.ok) throw new Error(data?.mensagem || 'Não foi possível enviar o pedido. Tente novamente.');
                if (!['EM_ANALISE', 'VERIFICADO'].includes(data?.status)) throw new Error('O pedido não foi confirmado. Tente novamente.');
                profile = { ...profile, crmVerificacao: data }; render();
            } catch (error) { message.textContent = error.message || 'Não foi possível enviar o pedido.'; button.disabled = dirty; }
        });
        controls.append(message, button, link, edit); render();
        return { setDirty() { dirty = true; render(); } };
    }
    window.EspectroCareCrm = Object.freeze({ badge, bindOwner, status });
})();
