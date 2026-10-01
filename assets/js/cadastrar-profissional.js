document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("formCadastroProfissional");
    if (!form) return;

    const fields = {
        nome: document.getElementById("nomeProf"),
        email: document.getElementById("emailProf"),
        telefone: document.getElementById("telProf"),
        cpf: document.getElementById("cpf"),
        estado: document.getElementById("estado"),
        cidade: document.getElementById("cidade"),
        formacao: document.getElementById("formacao"),
        registro: document.getElementById("registro"),
        senha: document.getElementById("senhaProf"),
        confirmarSenha: document.getElementById("confirmarSenhaProf")
    };
    const feedback = document.getElementById("formFeedback");
    const submitButton = document.getElementById("btnCadastrarProf");
    const passwordHelp = document.getElementById("passwordHelp");

    EspectroCareForms.bindMaskedInput(fields.telefone, EspectroCareForms.formatPhone, 11);
    EspectroCareForms.bindMaskedInput(fields.cpf, EspectroCareForms.formatCpf, 11);
    EspectroCareForms.setupPasswordUI(fields.senha, fields.confirmarSenha, passwordHelp);
    EspectroCareForms.bindPasswordToggle(
        document.getElementById("togglePasswordProf"),
        fields.senha,
        fields.confirmarSenha
    );

    form.addEventListener("submit", async event => {
        event.preventDefault();
        EspectroCareForms.setFeedback(feedback, "");

        const phone = EspectroCareForms.digits(fields.telefone.value, 11);
        const cpf = EspectroCareForms.digits(fields.cpf.value, 11);
        fields.telefone.setCustomValidity(phone.length === 10 || phone.length === 11 ? "" : "Informe um telefone com 10 ou 11 dígitos.");
        fields.cpf.setCustomValidity(cpf.length === 11 ? "" : "Informe um CPF com exatamente 11 dígitos.");

        if (!fields.estado.dataset.estadoId) fields.estado.setCustomValidity("Selecione um estado válido da lista.");
        if (!fields.cidade.dataset.cidadeId) fields.cidade.setCustomValidity("Selecione uma cidade válida da lista.");

        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        const payload = {
            nome: fields.nome.value.trim(),
            email: fields.email.value.trim(),
            telefone: phone,
            senha: fields.senha.value,
            estado: fields.estado.value.trim(),
            cidade: fields.cidade.value.trim(),
            cpf,
            formacao: fields.formacao.value.trim(),
            numRegistro: fields.registro.value.trim()
        };

        submitButton.disabled = true;
        submitButton.textContent = "Cadastrando...";

        try {
            const response = await fetch(`${EspectroCareConfig.API_BASE_URL}/cadastro/profissional`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            const message = await response.text();
            if (!response.ok) {
                EspectroCareForms.setFeedback(
                    feedback,
                    response.status === 409
                        ? "Não foi possível concluir o cadastro com os dados informados."
                        : message || "Revise os dados e tente novamente.",
                    "error"
                );
                return;
            }

            EspectroCareForms.setFeedback(feedback, "Cadastro realizado com sucesso. Você já pode entrar.", "success");
            form.reset();
            window.setTimeout(() => { window.location.href = "login.html"; }, 900);
        } catch (error) {
            EspectroCareForms.setFeedback(feedback, "Não foi possível conectar ao servidor. Tente novamente.", "error");
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = "Cadastrar";
        }
    });
});
