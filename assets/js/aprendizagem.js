document.addEventListener("DOMContentLoaded", async () => {
    const container = document.getElementById("containerAprendizagem");
    const searchInput = document.getElementById("searchInput");
    const status = document.getElementById("aprendizagemStatus");
    if (!container) return;

    let artigos = [];

    const normalize = value => String(value || "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");

    function escapeHtml(value) {
        const div = document.createElement("div");
        div.textContent = String(value || "");
        return div.innerHTML;
    }

    function formatDate(value) {
        if (!value) return "";
        const date = new Date(value);
        return Number.isNaN(date.getTime()) ? "" : date.toLocaleDateString("pt-BR");
    }

    function render(list) {
        container.innerHTML = "";
        if (!list.length) {
            status.textContent = artigos.length ? "Nenhum artigo corresponde à sua busca." : "Nenhum conteúdo foi publicado nesta área ainda.";
            status.hidden = false;
            return;
        }

        status.hidden = true;
        list.forEach(article => {
            const card = document.createElement("article");
            card.className = "blog api-learning-card";
            const categories = Array.isArray(article.categorias) ? article.categorias : [];
            card.innerHTML = `
                <div class="api-learning-content">
                    ${categories.length ? `<div class="api-learning-tags">${categories.map(category => `<span>${escapeHtml(category)}</span>`).join("")}</div>` : ""}
                    <h2>${escapeHtml(article.titulo || "Conteúdo")}</h2>
                    ${article.dataCriacao ? `<p class="api-learning-date">Publicado em ${escapeHtml(formatDate(article.dataCriacao))}</p>` : ""}
                    <a class="api-learning-link" href="aprendizagemdoc1.html?id=${encodeURIComponent(article.id)}">Ler artigo <span aria-hidden="true">→</span></a>
                </div>
            `;
            container.appendChild(card);
        });
    }

    try {
        status.textContent = "Carregando conteúdos...";
        status.hidden = false;
        const user = await EspectroCareAuth.requireAuth();
        if (!user) return;

        const response = await EspectroCareAuth.authorizedFetch("/api/aprendizagem");
        if (response.status === 401) {
            EspectroCareAuth.clearSession();
            window.location.replace("login.html");
            return;
        }
        if (response.status === 403) {
            status.textContent = "Sua conta não possui acesso a esta área.";
            return;
        }
        if (!response.ok) throw new Error();

        artigos = await response.json();
        render(artigos);
    } catch (error) {
        status.textContent = "Não foi possível carregar os conteúdos. Verifique sua conexão e tente novamente.";
        status.hidden = false;
    }

    searchInput?.addEventListener("input", () => {
        const term = normalize(searchInput.value);
        if (!term) return render(artigos);
        render(artigos.filter(article =>
            normalize(article.titulo).includes(term) ||
            (article.categorias || []).some(category => normalize(category).includes(term))
        ));
    });
});
