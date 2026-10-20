(function () {
    "use strict";
    let aberto = false;
    const mensagem = status => ({
        400: "Confira os dados do cadastro. Use Corrigir dados para voltar ao formulário.",
        409: "Não foi possível cadastrar com esses dados. Se já possui uma conta, faça login; caso contrário, confira os dados.",
        422: "E-mail não confirmado. Código inválido, expirado ou já utilizado. Confira o código ou solicite outro.",
        429: "Muitas tentativas. Aguarde 15 minutos antes de tentar novamente.",
        503: "O envio de e-mail está indisponível. Tente novamente mais tarde."
    }[status] || "Não foi possível concluir a solicitação. Tente novamente mais tarde.");

    async function post(path, body) {
        const controller = new AbortController();
        const timeout = window.setTimeout(() => controller.abort(), 75000);
        try {
            return await fetch(`${EspectroCareConfig.API_BASE_URL}${path}`, {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body), signal: controller.signal, cache: "no-store"
            });
        } finally { window.clearTimeout(timeout); }
    }

    // Dados e código permanecem apenas na memória; nenhum armazenamento de navegador é usado.
    async function cadastrar(payload, endpoint) {
        if (aberto) return false;
        aberto = true;
        const dialog = document.createElement("dialog");
        dialog.className = "confirmacao-email";
        dialog.setAttribute("aria-labelledby", "confirmacaoEmailTitulo");
        dialog.setAttribute("aria-describedby", "confirmacaoEmailDescricao");
        dialog.innerHTML = `
            <form novalidate>
                <h2 id="confirmacaoEmailTitulo">Confirme seu e-mail</h2>
                <p id="confirmacaoEmailDescricao">Para concluir o cadastro, informe o código recebido em <strong data-email></strong>.</p>
                <p class="confirmacao-email__ajuda">O código tem 8 dígitos e vale por 15 minutos. Confira também o spam. Se já possui uma conta, <a href="login.html">faça login</a>.</p>
                <label for="codigoConfirmacaoEmail">Código de confirmação</label>
                <input id="codigoConfirmacaoEmail" type="text" inputmode="numeric" autocomplete="one-time-code" maxlength="8" pattern="[0-9]{8}" required>
                <p data-feedback role="status" aria-live="polite"></p>
                <button type="submit" data-confirmar>Confirmar e cadastrar</button>
                <button type="button" data-reenviar>Reenviar código</button>
                <button type="button" data-corrigir>Corrigir e-mail ou dados</button>
            </form>`;
        dialog.querySelector("[data-email]").textContent = payload.email;
        const form = dialog.querySelector("form");
        const codigo = dialog.querySelector("input");
        const feedback = dialog.querySelector("[data-feedback]");
        const confirmar = dialog.querySelector("[data-confirmar]");
        const reenviar = dialog.querySelector("[data-reenviar]");
        const corrigir = dialog.querySelector("[data-corrigir]");
        let ocupado = false, proximoEnvio = 0, solicitado = false;
        let concluir;
        const resultado = new Promise(resolve => { concluir = resolve; });
        const atualizar = () => {
            const segundos = Math.max(0, Math.ceil((proximoEnvio - Date.now()) / 1000));
            confirmar.disabled = ocupado || !solicitado;
            codigo.disabled = ocupado || !solicitado;
            corrigir.disabled = ocupado;
            reenviar.disabled = ocupado || segundos > 0;
            reenviar.textContent = segundos > 0 ? `Reenviar em ${segundos}s` : "Reenviar código";
        };
        const mostrar = (texto, erro = false) => {
            feedback.textContent = texto;
            feedback.classList.toggle("confirmacao-email__erro", erro);
        };
        const fechar = sucesso => {
            dialog.close(); concluir(sucesso);
        };
        const solicitar = async () => {
            if (ocupado || Date.now() < proximoEnvio) return;
            ocupado = true; atualizar(); mostrar("Solicitando código…");
            try {
                const response = await post("/cadastro/email/solicitar", { email: payload.email.trim().toLowerCase() });
                if (!response.ok) {
                    if (response.status === 429) proximoEnvio = Date.now() + 900000;
                    mostrar(mensagem(response.status), true); return;
                }
                solicitado = true;
                proximoEnvio = Date.now() + 60000;
                mostrar("Se o e-mail puder ser usado em um novo cadastro, você receberá um código. Confira sua caixa de entrada e o spam.");
            } catch (_) {
                mostrar("Não foi possível conectar ao servidor. Confira sua conexão e tente novamente.", true);
            } finally { ocupado = false; atualizar(); if (solicitado) codigo.focus(); }
        };
        form.addEventListener("submit", async event => {
            event.preventDefault();
            if (ocupado || !solicitado || !form.reportValidity()) return;
            ocupado = true; atualizar(); mostrar("Confirmando e-mail e concluindo cadastro…");
            try {
                const response = await post(endpoint, { ...payload, codigoEmail: codigo.value });
                if (response.ok) { fechar(true); return; }
                mostrar(mensagem(response.status), true);
                if (response.status === 422) { codigo.value = ""; }
            } catch (_) {
                mostrar("Não foi possível confirmar a resposta do servidor. Tente novamente; se a conta já tiver sido criada, faça login.", true);
            } finally { ocupado = false; atualizar(); codigo.focus(); }
        });
        codigo.addEventListener("input", () => { codigo.value = codigo.value.replace(/\D/g, "").slice(0, 8); });
        reenviar.addEventListener("click", solicitar);
        corrigir.addEventListener("click", () => fechar(false));
        dialog.addEventListener("cancel", event => { event.preventDefault(); if (!ocupado) fechar(false); });
        document.body.appendChild(dialog);
        let timer;
        try {
            dialog.showModal();
            timer = window.setInterval(atualizar, 1000);
            await solicitar();
            return await resultado;
        } finally {
            if (timer) window.clearInterval(timer);
            codigo.value = ""; dialog.remove(); aberto = false;
        }
    }
    window.EspectroCareConfirmacaoEmail = Object.freeze({ cadastrar });
})();
