document.addEventListener("DOMContentLoaded", async () => {
    const status = document.getElementById("areaUsuarioStatus");
    const content = document.getElementById("areaUsuarioConteudo");

    function initials(name) {
        return String(name || "U").trim().split(/\s+/).slice(0,2)
            .map(part => part[0]?.toUpperCase() || "").join("");
    }
    function setText(id, value, fallback = "Não informado") {
        const element = document.getElementById(id);
        if (element) element.textContent = value || fallback;
    }

    try {
        const user = window.EspectroCareAuthGuard
            ? await window.EspectroCareAuthGuard
            : await EspectroCareAuth.requireAuth();
        if (!user) return;

        const profilePath = user.tipoPerfil === "PROFISSIONAL" ? "/api/perfil" : "/api/perfil-responsavel";
        const response = await EspectroCareAuth.authorizedFetch(profilePath);
        if (response.status === 401) {
            EspectroCareAuth.clearSession();
            window.location.replace("login.html");
            return;
        }
        if (!response.ok) throw new Error();
        const profile = await response.json();

        document.getElementById("areaUsuarioAvatar").textContent = initials(user.nome);
        setText("areaUsuarioNome", user.nome, "Usuário");
        setText("areaUsuarioEmail", user.email);
        setText("areaUsuarioTipo", user.tipoPerfil === "PROFISSIONAL" ? "Profissional" : "Responsável");
        setText("areaUsuarioTelefone", profile.telefone ? EspectroCareForms.formatPhone(profile.telefone) : "");
        setText("areaUsuarioLocalizacao", [profile.cidade, profile.estado].filter(Boolean).join(" - "));

        const professionalInfo = document.getElementById("areaUsuarioProfissional");
        if (user.tipoPerfil === "PROFISSIONAL") {
            professionalInfo.hidden = false;
            setText("areaUsuarioFormacao", profile.formacao);
            setText("areaUsuarioRegistro", profile.numRegistro);
        } else {
            professionalInfo.hidden = true;
        }

        document.getElementById("editarPerfilLink").href = EspectroCareAuth.profilePage(user.tipoPerfil);
        content.hidden = false;
        status.hidden = true;
    } catch (error) {
        status.textContent = "Não foi possível carregar sua área agora. Verifique sua conexão e tente novamente.";
        status.hidden = false;
    }
});
