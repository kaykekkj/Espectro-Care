document.addEventListener("DOMContentLoaded", async () => {
    const profileCard = document.getElementById("profileCard");
    const status = document.getElementById("perfilProfissionalStatus");
    if (!profileCard) return;

    function escapeHtml(value) {
        const div = document.createElement("div");
        div.textContent = String(value || "");
        return div.innerHTML;
    }

    function initials(name) {
        return String(name || "P").split(/\s+/).slice(0, 2).map(part => part[0]?.toUpperCase() || "").join("");
    }

    const id = new URLSearchParams(location.search).get("id");
    if (!id || !/^\d+$/.test(id)) {
        status.textContent = "Perfil profissional inválido.";
        status.hidden = false;
        return;
    }

    try {
        status.textContent = "Carregando perfil...";
        status.hidden = false;
        const user = await EspectroCareAuth.requireAuth();
        if (!user) return;

        const response = await EspectroCareAuth.authorizedFetch(`/api/profissionais/${encodeURIComponent(id)}`);
        if (response.status === 401) {
            EspectroCareAuth.clearSession();
            window.location.replace("login.html");
            return;
        }
        if (response.status === 404) {
            status.textContent = "Profissional não encontrado.";
            return;
        }
        if (!response.ok) throw new Error();

        const profissional = await response.json();
        const location = [profissional.cidade, profissional.estado].filter(Boolean).join(" - ");
        const phoneDigits = String(profissional.telefone || "").replace(/\D/g, "");
        const phone = window.EspectroCareForms ? EspectroCareForms.formatPhone(phoneDigits) : phoneDigits;

        profileCard.innerHTML = `
            <div class="card-header api-profile-header">
                <div class="api-professional-avatar api-profile-avatar" aria-hidden="true">${initials(profissional.nome)}</div>
                <div class="header-info">
                    <h1 class="info-name">${escapeHtml(profissional.nome || "Profissional")}</h1>
                    ${profissional.formacao ? `<p class="info-crp">${escapeHtml(profissional.formacao)}</p>` : ""}
                    ${profissional.numRegistro ? `<p class="api-profile-register">Registro: ${escapeHtml(profissional.numRegistro)}</p>` : ""}
                </div>
            </div>
            <div class="card-body">
                ${location ? `<p class="info-text"><strong>Localização:</strong> ${escapeHtml(location)}</p>` : ""}
                <p class="info-text"><strong>Sobre:</strong> ${escapeHtml(profissional.bio || "Este profissional ainda não adicionou uma biografia.")}</p>
            </div>
            <div class="card-footer">
                ${phone ? `<a class="phone-contact" href="tel:${phoneDigits}">${escapeHtml(phone)}</a>` : '<span class="api-muted">Telefone não informado.</span>'}
                <a class="api-back-link" href="profissionais.html">Voltar para profissionais</a>
            </div>
        `;
        EspectroCarePhoto.render(profileCard.querySelector(".api-professional-avatar"), profissional.fotoPerfilUrl, profissional.nome);
        status.hidden = true;
    } catch (error) {
        status.textContent = "Não foi possível carregar este perfil. Tente novamente.";
        status.hidden = false;
    }
});
