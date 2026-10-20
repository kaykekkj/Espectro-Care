(async function () {
    const email = document.getElementById("resetEmail");
    const code = document.getElementById("resetCode");
    const password = document.getElementById("newPassword");
    const confirmation = document.getElementById("confirmPassword");
    const feedback = document.getElementById("resetFeedback");
    const requestForm = document.getElementById("requestReset");
    const confirmForm = document.getElementById("confirmReset");
    const fromProfile = new URLSearchParams(location.search).get("origem") === "perfil";
    let profileReady = !fromProfile;
    const show = (message, type = "info") => EspectroCareForms.setFeedback(feedback, message, type);
    const clearValidity = () => { password.setCustomValidity(""); confirmation.setCustomValidity(""); };
    password.addEventListener("input", clearValidity);
    confirmation.addEventListener("input", clearValidity);
    if (fromProfile) {
        email.readOnly = true;
        requestForm.querySelector("button").disabled = true;
        confirmForm.querySelector("button").disabled = true;
        try {
            const user = await EspectroCareAuth.requireAuth();
            if (!user) return;
            email.value = user.email;
            document.getElementById("passwordBack").href = EspectroCareAuth.profilePage(user.tipoPerfil);
            document.getElementById("passwordBack").textContent = "Voltar ao perfil";
            profileReady = true;
            requestForm.querySelector("button").disabled = false;
            confirmForm.querySelector("button").disabled = false;
        } catch { show("Não foi possível carregar seu perfil. Atualize a página para tentar novamente.", "error"); }
    }
    async function send(form, path, body, authorized) {
        const button = form.querySelector("button");
        button.disabled = true;
        try {
            const options = { method: "POST", headers: { "Content-Type": "application/json" } };
            if (body) options.body = JSON.stringify(body);
            const response = authorized ? await EspectroCareAuth.authorizedFetch(path, options)
                : await fetch(`${EspectroCareConfig.API_BASE_URL}${path}`, options);
            const result = await response.json().catch(() => ({}));
            if (!response.ok) {
                show(response.status === 401 ? "Sua sessão expirou. Entre novamente."
                    : result.mensagem || "Não foi possível concluir a solicitação. Tente mais tarde.", "error");
                return false;
            }
            show(result.mensagem, "success"); return true;
        } catch { show("Não foi possível conectar ao servidor. Verifique sua conexão.", "error"); return false; }
        finally { button.disabled = false; }
    }
    requestForm.addEventListener("submit", async event => {
        event.preventDefault();
        if (!profileReady) return;
        await send(requestForm, fromProfile ? "/api/conta/recuperacao-senha" : "/auth/esqueci-senha",
            fromProfile ? null : { email: email.value.trim() }, fromProfile);
    });
    confirmForm.addEventListener("submit", async event => {
        event.preventDefault();
        if (!profileReady || !requestForm.reportValidity()) return;
        password.setCustomValidity(EspectroCareForms.isStrongPassword(password.value)
            && new TextEncoder().encode(password.value).length <= 72 ? "" : "Use uma senha forte de 8 caracteres ou mais, com até 72 bytes.");
        confirmation.setCustomValidity(password.value === confirmation.value ? "" : "As senhas não coincidem.");
        if (!confirmForm.reportValidity()) return;
        if (await send(confirmForm, "/auth/redefinir-senha", {
            email: email.value.trim(), codigo: code.value, novaSenha: password.value
        }, false)) {
            EspectroCareAuth.clearSession();
            confirmForm.reset(); confirmForm.hidden = true; requestForm.hidden = true;
            document.getElementById("resetLogin").hidden = false;
            document.getElementById("passwordBack").href = "login.html";
            document.getElementById("passwordBack").textContent = "Voltar ao login";
        }
    });
})();
