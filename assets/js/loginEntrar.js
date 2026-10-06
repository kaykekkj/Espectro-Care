document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("formLogin");
    const feedback = document.getElementById("loginFeedback");
    const button = document.getElementById("btnLogar");
    if (!form) return;

    function safeRedirect() {
        const redirect = new URLSearchParams(location.search).get("redirect");
        if (!redirect || !redirect.startsWith("/") || redirect.startsWith("//")) return null;
        try {
            const target = new URL(redirect, location.origin);
            if (target.origin !== location.origin) return null;
            return `${target.pathname}${target.search}${target.hash}`;
        } catch { return null; }
    }

    form.addEventListener("submit", async event => {
        event.preventDefault();
        EspectroCareForms.setFeedback(feedback, "");

        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        const email = document.getElementById("email").value.trim();
        const senha = document.getElementById("senha").value;
        button.disabled = true;
        button.textContent = "Entrando...";

        try {
            const response = await fetch(`${EspectroCareConfig.API_BASE_URL}/auth/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, senha })
            });

            if (!response.ok) {
                const text = await response.text();
                EspectroCareForms.setFeedback(
                    feedback,
                    response.status === 401 ? "Email ou senha inválidos." : text || "Não foi possível entrar.",
                    "error"
                );
                return;
            }

            const data = await response.json();
            EspectroCareAuth.setSession({ token: data.token, email: data.email });

            const currentUser = await EspectroCareAuth.getCurrentUser();
            if (!currentUser) throw new Error("Sessão inválida após o login.");

            EspectroCareForms.setFeedback(feedback, "Login realizado com sucesso.", "success");
            const redirect = safeRedirect();
            if (redirect) {
                window.location.href = redirect;
            } else {
                window.location.href = currentUser.tipoPerfil === "ADMIN" ? "admin.html" : EspectroCareAuth.accountAreaPage();
            }
        } catch (error) {
            EspectroCareAuth.clearSession();
            EspectroCareForms.setFeedback(feedback, "Não foi possível concluir o login. Tente novamente.", "error");
        } finally {
            button.disabled = false;
            button.textContent = "Entrar";
        }
    });
});
