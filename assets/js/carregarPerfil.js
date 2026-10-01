document.addEventListener("DOMContentLoaded", async () => {
    const form = document.getElementById("formPerfilProf");
    const feedback = document.getElementById("msg");
    if (!form) return;

    const fields = {
        nome: document.getElementById("nome"),
        email: document.getElementById("email"),
        bio: document.getElementById("bio"),
        telefone: document.getElementById("telefone"),
        estado: document.getElementById("estado"),
        cidade: document.getElementById("cidade"),
        formacao: document.getElementById("formacao"),
        numRegistro: document.getElementById("numRegistro")
    };

    EspectroCareForms.bindMaskedInput(fields.telefone, EspectroCareForms.formatPhone, 11);

    function show(message, type) {
        EspectroCareForms.setFeedback(feedback, message, type);
    }

    async function handleAuthError(response) {
        if (response.status === 401) {
            EspectroCareAuth.clearSession();
            window.location.replace("login.html");
            return true;
        }
        if (response.status === 403) {
            show("Este perfil não corresponde ao tipo de usuário autenticado.", "error");
            return true;
        }
        return false;
    }

    try {
        const currentUser = await EspectroCareAuth.requireAuth();
        if (!currentUser) return;
        if (currentUser.tipoPerfil !== "PROFISSIONAL") {
            show("Este perfil é exclusivo para profissionais.", "error");
            window.setTimeout(() => { window.location.href = "userResponsavel.html"; }, 1000);
            return;
        }

        const response = await EspectroCareAuth.authorizedFetch("/api/perfil");
        if (await handleAuthError(response)) return;
        if (!response.ok) throw new Error();

        const data = await response.json();
        fields.nome.value = data.nome || "";
        fields.email.value = data.email || "";
        fields.bio.value = data.bio || "";
        fields.telefone.value = EspectroCareForms.formatPhone(data.telefone || "");
        fields.estado.value = data.estado || "";
        fields.cidade.value = data.cidade || "";
        fields.formacao.value = data.formacao || "";
        fields.numRegistro.value = data.numRegistro || "";
    } catch (error) {
        show("Não foi possível carregar seu perfil. Tente novamente.", "error");
    }

    form.addEventListener("submit", async event => {
        event.preventDefault();
        show("", "info");

        const phone = fields.telefone.value ? EspectroCareForms.digits(fields.telefone.value, 11) : "";
        if (phone && phone.length !== 10 && phone.length !== 11) {
            fields.telefone.setCustomValidity("Informe um telefone com 10 ou 11 dígitos.");
        } else {
            fields.telefone.setCustomValidity("");
        }

        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        const button = form.querySelector('button[type="submit"]');
        button.disabled = true;
        button.textContent = "Salvando...";

        try {
            const response = await EspectroCareAuth.authorizedFetch("/api/perfil", {
                method: "PUT",
                body: JSON.stringify({
                    nome: fields.nome.value.trim(),
                    bio: fields.bio.value.trim(),
                    telefone: phone,
                    estado: fields.estado.value.trim(),
                    cidade: fields.cidade.value.trim(),
                    formacao: fields.formacao.value.trim(),
                    numRegistro: fields.numRegistro.value.trim()
                })
            });

            if (await handleAuthError(response)) return;
            if (!response.ok) throw new Error();
            const updated = await response.json();
            fields.telefone.value = EspectroCareForms.formatPhone(updated.telefone || "");
            show("Perfil atualizado com sucesso.", "success");
        } catch (error) {
            show("Não foi possível atualizar seu perfil.", "error");
        } finally {
            button.disabled = false;
            button.textContent = "Salvar alterações";
        }
    });
});
