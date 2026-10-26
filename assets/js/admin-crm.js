document.addEventListener('DOMContentLoaded', async () => {
    const panel = document.getElementById('adminCrm');
    if (!panel) return;
    const user = await EspectroCareAuth.requireAuth().catch(() => null);
    if (user?.tipoPerfil !== 'ADMIN') return;
    panel.hidden = false;
    const list = document.getElementById('listaCrm');
    const status = document.getElementById('crmAdminStatus');
    const next = document.getElementById('crmProxima');
    const previous = document.getElementById('crmAnterior');
    const refresh = document.getElementById('crmAtualizar');
    const request = EspectroCareAdminAPI.request;
    let page = 0, busy = false;
    async function load() {
        if (busy) return;
        busy = true; previous.disabled = next.disabled = refresh.disabled = true;
        status.textContent = 'Carregando pedidos de conferência...'; list.replaceChildren();
        try {
            const data = await request('/api/admin/crm/solicitacoes?pagina=' + page);
            if (!Array.isArray(data?.content)) throw new Error('Não foi possível carregar os pedidos.');
            for (const item of data.content) {
                const row = document.createElement('article'); row.className = 'admin-row';
                const title = document.createElement('h3'); title.textContent = item.nome;
                const register = document.createElement('p'); register.textContent = item.numRegistro;
                const date = document.createElement('p'); date.textContent = 'Solicitado em: ' + new Date(item.solicitadoEm).toLocaleString('pt-BR');
                const link = document.createElement('a'); link.href = 'https://portal.cfm.org.br/busca-medicos/'; link.target = '_blank'; link.rel = 'noopener noreferrer';
                link.textContent = 'Abrir consulta oficial do CFM (nova aba)';
                const label = document.createElement('label');
                const check = document.createElement('input'); check.type = 'checkbox'; check.className = 'crm-confirm-check';
                label.append(check, ' Conferi nome completo, número, UF e situação ativa no portal oficial.');
                const actions = document.createElement('div'); actions.className = 'admin-actions';
                const approve = document.createElement('button'); approve.type = 'button'; approve.textContent = 'Confirmar CRM'; approve.disabled = true;
                const reject = document.createElement('button'); reject.type = 'button'; reject.textContent = 'Não confirmado'; reject.className = 'admin-delete';
                const feedback = document.createElement('p'); feedback.setAttribute('role', 'status');
                check.addEventListener('change', () => { approve.disabled = !check.checked; });
                async function review(confirmed) {
                    if (confirmed && !check.checked) return;
                    approve.disabled = reject.disabled = check.disabled = true;
                    try {
                        await request('/api/admin/crm/solicitacoes/' + encodeURIComponent(item.id), { method: 'PUT', body: JSON.stringify({ revisao: item.revisao, confirmado: confirmed }) });
                        await load();
                    } catch (error) { feedback.textContent = error.message; check.disabled = reject.disabled = false; approve.disabled = !check.checked; }
                }
                approve.addEventListener('click', () => review(true)); reject.addEventListener('click', () => review(false));
                actions.append(approve, reject); row.append(title, register, date, link, label, actions, feedback); list.append(row);
            }
            status.textContent = data.content.length ? 'Página ' + (page + 1) + ' de ' + data.totalPages + '. Confira os dados antes de aprovar. O selo informa a data da conferência e não comprova identidade ou especialidade.' : 'Nenhum pedido nesta página.';
            previous.disabled = page === 0; next.disabled = data.last !== false;
        } catch (error) { status.textContent = error.message; previous.disabled = page === 0; }
        finally { busy = false; refresh.disabled = false; }
    }
    next.addEventListener('click', () => { page++; load(); }); previous.addEventListener('click', () => { page = Math.max(0, page - 1); load(); }); refresh.addEventListener('click', load);
    await load();
});
