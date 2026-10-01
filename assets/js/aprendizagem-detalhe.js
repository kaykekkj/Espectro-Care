document.addEventListener("DOMContentLoaded", async () => {
    const title = document.getElementById("artigoTitulo");
    const meta = document.getElementById("artigoMeta");
    const content = document.getElementById("artigoConteudo");
    const status = document.getElementById("artigoStatus");

    const id = new URLSearchParams(location.search).get("id");
    if (!id || !/^\d+$/.test(id)) {
        status.textContent = "Artigo inválido.";
        status.hidden = false;
        return;
    }

    function formatDate(value) {
        if (!value) return "";
        const date = new Date(value);
        return Number.isNaN(date.getTime()) ? "" : date.toLocaleDateString("pt-BR");
    }

    function sanitizeHtml(html) {
        const allowedTags = new Set(["P", "BR", "STRONG", "EM", "B", "I", "UL", "OL", "LI", "H2", "H3", "H4", "BLOCKQUOTE"]);
        const parser = new DOMParser();
        const doc = parser.parseFromString(`<div>${html || ""}</div>`, "text/html");
        const root = doc.body.firstElementChild;
        root.querySelectorAll("script, style, iframe, object, embed").forEach(element => element.remove());

        [...root.querySelectorAll("*")].forEach(element => {
            if (!allowedTags.has(element.tagName)) {
                element.replaceWith(...element.childNodes);
                return;
            }

            [...element.attributes].forEach(attribute => element.removeAttribute(attribute.name));
        });

        return root.innerHTML;
    }

    try {
        status.textContent = "Carregando artigo...";
        status.hidden = false;
        const user = await EspectroCareAuth.requireAuth();
        if (!user) return;

        const response = await EspectroCareAuth.authorizedFetch(`/api/aprendizagem/${encodeURIComponent(id)}`);
        if (response.status === 401) {
            EspectroCareAuth.clearSession();
            window.location.replace("login.html");
            return;
        }
        if (response.status === 404) {
            status.textContent = "Artigo não encontrado ou ainda não publicado.";
            return;
        }
        if (!response.ok) throw new Error();

        const article = await response.json();
        title.textContent = article.titulo || "Aprendizagem";
        const categories = Array.isArray(article.categorias) ? article.categorias.join(" • ") : "";
        const date = formatDate(article.dataCriacao);
        meta.textContent = [categories, date ? `Publicado em ${date}` : ""].filter(Boolean).join(" — ");
        content.innerHTML = sanitizeHtml(article.conteudoHtml);
        status.hidden = true;
    } catch (error) {
        status.textContent = "Não foi possível carregar o artigo. Tente novamente.";
        status.hidden = false;
    }
});
