document.addEventListener("DOMContentLoaded", async () => {
    const container = document.getElementById("containerProfissionais");
    const searchInput = document.getElementById("searchInput");
    const status = document.getElementById("profissionaisStatus");
    if (!container) return;

    let profissionais = [];

    const normalize = value => String(value || "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");

    function initials(name) {
        return String(name || "P")
            .trim()
            .split(/\s+/)
            .slice(0, 2)
            .map(part => part[0]?.toUpperCase() || "")
            .join("");
    }

    function formatPhone(value) {
        return window.EspectroCareForms
            ? EspectroCareForms.formatPhone(value || "")
            : value || "";
    }

    function render(list) {
        container.innerHTML = "";
        if (!list.length) {
            status.textContent = profissionais.length
                ? "Nenhum profissional corresponde à sua busca."
                : "Nenhum profissional cadastrado está disponível no momento.";
            status.hidden = false;
            return;
        }

        status.hidden = true;
        list.forEach(profissional => {
            const article = document.createElement("article");
            article.className = "card-profissional api-professional-card";

            const location = [profissional.cidade, profissional.estado].filter(Boolean).join(" - ");
            const phone = formatPhone(profissional.telefone);
            const details = [profissional.formacao, profissional.numRegistro, location].filter(Boolean);

            article.innerHTML = `
                <div class="api-professional-header">
                    <div class="api-professional-avatar" aria-hidden="true">${initials(profissional.nome)}</div>
                    <div>
                        <h3>${escapeHtml(profissional.nome || "Profissional")}</h3>
                        ${profissional.formacao ? `<p class="profissao-profissional">${escapeHtml(profissional.formacao)}</p>` : ""}
                    </div>
                </div>
                <div class="api-professional-body">
                    ${details.length ? `<ul class="api-professional-meta">${details.map(item => `<li>${escapeHtml(item)}</li>`).join("")}</ul>` : ""}
                    <p class="descricao-profissional">${escapeHtml(profissional.bio || "Perfil profissional cadastrado na EspectroCare.")}</p>
                </div>
                <div class="api-professional-actions">
                    <a class="btn-ver-perfil" href="perfil-profissional.html?id=${encodeURIComponent(profissional.id)}">Ver perfil <span aria-hidden="true">→</span></a>
                    ${phone ? `<a class="api-phone-link" href="tel:${String(profissional.telefone).replace(/\D/g, "")}">${escapeHtml(phone)}</a>` : ""}
                </div>
            `;
            container.appendChild(article);
        });
    }

    function escapeHtml(value) {
        const div = document.createElement("div");
        div.textContent = String(value || "");
        return div.innerHTML;
    }

    try {
        status.textContent = "Carregando profissionais...";
        status.hidden = false;
        const response = await EspectroCareAuth.authorizedFetch("/api/profissionais");
        if (response.status === 401) {
            status.textContent = "Faça login para carregar os profissionais. A página continua disponível para consulta da interface.";
            status.hidden = false;
            return;
        }
        if (response.status === 403) {
            status.textContent = "Sua conta não possui acesso a esta área.";
            return;
        }
        if (!response.ok) throw new Error();

        profissionais = await response.json();
        render(profissionais);
    } catch (error) {
        status.textContent = "Não foi possível carregar os profissionais. Verifique sua conexão e tente novamente.";
        status.hidden = false;
    }

    searchInput?.addEventListener("input", () => {
        const term = normalize(searchInput.value);
        if (!term) return render(profissionais);
        render(profissionais.filter(profissional =>
            [profissional.nome, profissional.formacao, profissional.cidade, profissional.estado, profissional.bio, profissional.numRegistro]
                .some(value => normalize(value).includes(term))
        ));
    });
});
