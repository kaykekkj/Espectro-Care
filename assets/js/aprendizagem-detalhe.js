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
        const image = document.getElementById("artigoImagem");
        if (article.imagemUrl) {
            image.src = EspectroCareConfig.API_BASE_URL + article.imagemUrl;
            image.alt = `Imagem de capa: ${article.titulo}`; image.hidden = false;
            image.addEventListener("error", () => { image.hidden = true; }, { once: true });
        }
        if (article.resumo) {
            document.getElementById("artigoResumo").textContent = article.resumo;
            document.getElementById("artigoResumoSecao").hidden = false;
        }
        const refs = document.getElementById("artigoReferencias");
        for (const link of (article.referencias || "").split(/\r?\n/)) {
            try {
                const url = new URL(link.trim());
                if (!["http:", "https:"].includes(url.protocol) || url.username || url.password) continue;
                const li = document.createElement("li"), a = document.createElement("a");
                a.href = url.href; a.textContent = link.trim(); a.target = "_blank"; a.rel = "noopener noreferrer";
                li.append(a); refs.append(li);
            } catch { /* Conteúdos legados inválidos não viram links. */ }
        }
        document.getElementById("artigoReferenciasSecao").hidden = !refs.children.length;
        status.hidden = true;
        // A indisponibilidade das recomendações não impede a leitura do artigo.
        try {
            const listResponse = await fetch(EspectroCareConfig.API_BASE_URL + "/api/aprendizagem");
            if (!listResponse.ok) return;
            const list = await listResponse.json();
            const related = list.filter(item => String(item.id) !== String(id)).map((item, index) => ({ item, index,
                score: (item.categorias || []).filter(cat => (article.categorias || []).includes(cat)).length
            })).sort((a, b) => b.score - a.score || a.index - b.index).slice(0, 3);
            const container = document.getElementById("recomendacoesLista");
            related.forEach(({ item }) => {
                const a = document.createElement("a"); a.className = "recomendacao-card";
                a.href = `aprendizagemdoc1.html?id=${encodeURIComponent(item.id)}`;
                if (item.imagemUrl) {
                    const img = document.createElement("img"); img.src = EspectroCareConfig.API_BASE_URL + item.imagemUrl;
                    img.alt = ""; img.loading = "lazy"; img.addEventListener("error", () => img.remove(), { once: true }); a.append(img);
                }
                const h = document.createElement("h3"); h.textContent = item.titulo; a.append(h);
                container.append(a);
            });
            document.getElementById("artigoRecomendacoes").hidden = !related.length;
        } catch { /* Recomendações opcionais. */ }
    } catch (error) {
        status.textContent = "Não foi possível carregar o artigo. Tente novamente.";
        status.hidden = false;
    }
});
