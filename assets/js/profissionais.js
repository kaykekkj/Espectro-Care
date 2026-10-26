document.addEventListener("DOMContentLoaded", async () => {
    const container = document.getElementById("containerProfissionais");
    const searchInput = document.getElementById("searchInput");
    const status = document.getElementById("profissionaisStatus");
    if (!container) return;

    let profissionais = [];
    const areaFilter = document.getElementById("especialidadeFiltro");
    const info = document.getElementById("especialidadeInfo");
    const requestedArea = new URLSearchParams(location.search).get("especialidade");
    const requestedKey = EspectroCareEspecialidades.key(requestedArea);
    areaFilter.value = requestedKey;
    let loaded = false;

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
            status.textContent = areaFilter.value
                ? `Nenhum profissional de ${areaFilter.selectedOptions[0].textContent} corresponde aos filtros selecionados.`
                : profissionais.length
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
            const details = [profissional.formacao, location].filter(Boolean);

            article.innerHTML = `
                <a class="api-professional-header api-professional-entry" data-auth-action href="perfil-profissional.html?id=${encodeURIComponent(profissional.id)}" aria-label="Ver perfil profissional">
                    <div class="api-professional-avatar" aria-hidden="true">${escapeHtml(initials(profissional.nome))}</div>
                    <div>
                        <h3>${escapeHtml(profissional.nome || "Profissional")}</h3>
                        ${profissional.formacao ? `<p class="profissao-profissional">${escapeHtml(profissional.formacao)}</p>` : ""}
                    </div>
                </a>
                <div class="api-professional-body">
                    ${details.length ? `<ul class="api-professional-meta">${details.map(item => `<li>${escapeHtml(item)}</li>`).join("")}</ul>` : ""}
                    <p class="descricao-profissional">${escapeHtml(profissional.bio || "Perfil profissional cadastrado na EspectroCare.")}</p>
                </div>
                <div class="api-professional-actions">
                    <a class="btn-ver-perfil" data-auth-action href="perfil-profissional.html?id=${encodeURIComponent(profissional.id)}">Ver perfil <span aria-hidden="true">→</span></a>
                </div>
            `;
            EspectroCarePhoto.render(article.querySelector(".api-professional-avatar"), profissional.fotoPerfilUrl, profissional.nome);
            article.addEventListener("click", event => {
                if (!event.target.closest("a, button, input")) {
                    article.querySelector(".btn-ver-perfil").click();
                }
            });
            EspectroCareActionGate.prepare(article);
            container.appendChild(article);
        });
    }

    function escapeHtml(value) {
        const div = document.createElement("div");
        div.textContent = String(value || "");
        return div.innerHTML;
    }

    function applyFilters() {
        const term = normalize(searchInput?.value).trim();
        const area = areaFilter.value;
        info.textContent = area
            ? `Área: ${areaFilter.selectedOptions[0].textContent}. Filtro pela formação informada no perfil; não comprova título de especialista.`
            : new URLSearchParams(location.search).has("especialidade") && !requestedKey
                ? "Área da URL não reconhecida. Exibindo todas as áreas."
                : "Todas as áreas profissionais.";
        if (!loaded) return;
        render(profissionais.filter(profissional =>
            (!area || EspectroCareEspecialidades.key(profissional.formacao) === area) &&
            (!term || [profissional.nome, profissional.formacao, profissional.cidade, profissional.estado, profissional.bio, profissional.numRegistro]
                .some(value => normalize(value).includes(term)))
        ));
    }

    function updateUrl() {
        const url = new URL(location.href);
        if (areaFilter.value) url.searchParams.set("especialidade", areaFilter.value);
        else url.searchParams.delete("especialidade");
        history.replaceState(null, "", url);
    }
    areaFilter.addEventListener("change", () => { updateUrl(); applyFilters(); });
    document.getElementById("limparFiltros").addEventListener("click", () => {
        areaFilter.value = "";
        if (searchInput) searchInput.value = "";
        updateUrl();
        applyFilters();
        searchInput?.focus();
    });
    searchInput?.addEventListener("input", applyFilters);
    applyFilters();

    try {
        status.textContent = "Carregando profissionais...";
        status.hidden = false;
        const response = await EspectroCareAuth.authorizedFetch("/api/profissionais", { cache: "no-store" });
        if (response.status === 401) {
            EspectroCareAuth.clearSession();
            window.location.href = `login.html?redirect=${encodeURIComponent(location.pathname + location.search)}`;
            return;
        }
        if (response.status === 403) {
            status.textContent = "Sua conta não tem permissão para acessar os profissionais.";
            return;
        }
        if (!response.ok) throw new Error();

        profissionais = await response.json();
        if (!Array.isArray(profissionais)) throw new Error();
        loaded = true;
        applyFilters();
    } catch (error) {
        status.textContent = "Não foi possível carregar os profissionais. Verifique sua conexão e tente novamente.";
        status.hidden = false;
    }

});
