document.addEventListener("DOMContentLoaded", async () => {
    const status = document.getElementById("adminStatus");
    const form = document.getElementById("cadastroAdmin");
    // Mantém o token apenas na memória desta página e remove-o da barra/histórico.
    const token = new URLSearchParams(location.hash.slice(1)).get("token");
    history.replaceState(null, "", location.pathname);
    async function send(path, body) {
        const response = await fetch(`${EspectroCareConfig.API_BASE_URL}${path}`, {
            method: "POST", cache: "no-store", headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body)
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.mensagem || "Dados inválidos. Verifique os campos e os requisitos de senha.");
        return data;
    }
    if (!token || !/^[A-Za-z0-9_-]{43}$/.test(token)) {
        status.textContent = "Convite inválido, expirado, revogado ou já utilizado. Solicite um novo convite.";
        return;
    }
    try {
        const invitation = await send("/cadastro/admin/convite/validar", { token });
        document.getElementById("email").value = invitation.email;
        form.hidden = false;
        status.textContent = "Convite validado. Preencha seus dados para concluir.";
    } catch (error) { status.textContent = error.message || "Não foi possível validar o convite."; return; }
    form.addEventListener("submit", async event => {
        event.preventDefault();
        const senha = document.getElementById("senha").value;
        if (!EspectroCareForms.isStrongPassword(senha) || new TextEncoder().encode(senha).length > 72) {
            status.textContent = "A senha deve atender aos requisitos informados."; return;
        }
        if (!form.reportValidity()) return;
        const button = form.querySelector("button"); button.disabled = true;
        try {
            const result = await send("/cadastro/admin", { token, nome: document.getElementById("nome").value.trim(),
                email: document.getElementById("email").value, senha });
            form.reset(); form.hidden = true; status.textContent = result.mensagem;
        } catch (error) { status.textContent = error.message || "Não foi possível concluir o cadastro."; }
        finally { button.disabled = false; }
    });
});
