document.addEventListener("DOMContentLoaded", () => {
    const container = document.getElementById("homeArtigos");
    const status = document.getElementById("homeArtigosStatus");
    const retry = document.getElementById("homeArtigosRetry");
    if (!container || !status || !retry) return;

    function show(message) {
        status.textContent = message;
        status.hidden = false;
    }

    function coverPlaceholder() {
        const placeholder = document.createElement("div");
        placeholder.className = "home-artigo-sem-capa";
        placeholder.textContent = "Artigo EspectroCare";
        placeholder.setAttribute("aria-hidden", "true");
        return placeholder;
    }

    function card(article) {
        const link = document.createElement("a");
        link.className = "card-artigo-home";
        link.href = `pages/aprendizagemdoc1.html?id=${encodeURIComponent(article.id)}`;
        link.dataset.authAction = "";
        const placeholder = coverPlaceholder();
        link.append(placeholder);
        if (article.imagemUrl) {
            try {
                const url = new URL(article.imagemUrl, `${EspectroCareConfig.API_BASE_URL}/`);
                if (!["http:", "https:"].includes(url.protocol)) throw new Error();
                const image = document.createElement("img");
                image.alt = "";
                // Mantém a alternativa até a imagem carregar, inclusive em erro de rede.
                image.hidden = true;
                image.addEventListener("load", () => { placeholder.remove(); image.hidden = false; }, { once: true });
                image.addEventListener("error", () => image.remove(), { once: true });
                image.src = url.href;
                link.prepend(image);
            } catch { /* URL inválida: mantém a capa neutra. */ }
        }
        const title = document.createElement("h2");
        title.textContent = article.titulo?.trim() || "Artigo da EspectroCare";
        link.append(title);
        return link;
    }

    async function load() {
        container.replaceChildren();
        container.hidden = false;
        container.setAttribute("aria-busy", "true");
        retry.hidden = true;
        show("Carregando artigos...");
        try {
            // Mesma listagem pública de Aprendizagem; o backend só retorna publicados.
            const response = await EspectroCareAuth.authorizedFetch("/api/aprendizagem", {
                cache: "no-store", signal: AbortSignal.timeout(30000)
            });
            if (response.status === 401 || response.status === 403) {
                if (response.status === 401) EspectroCareAuth.clearSession();
                show(response.status === 401 ? "Entre na sua conta para acessar os artigos." : "Sua conta não tem permissão para acessar os artigos.");
                if (response.status === 401) {
                    const login = document.createElement("a");
                    login.href = `pages/login.html?redirect=${encodeURIComponent(location.pathname + location.search)}`;
                    login.textContent = " Entrar";
                    status.append(login);
                }
                return;
            }
            if (!response.ok) throw new Error();
            const articles = await response.json();
            if (!Array.isArray(articles)) throw new Error();
            // Não existe destaque no contrato. dataCriacao é a data de publicação
            // usada no serviço atual; em empate, mantém a ordem recebida da API.
            const date = article => Date.parse(article.dataCriacao) || 0;
            const seen = new Set();
            const recent = articles.filter(article => {
                if (!article || !/^\d+$/.test(String(article.id)) || seen.has(String(article.id))) return false;
                seen.add(String(article.id));
                return true;
            }).sort((a, b) => date(b) - date(a)).slice(0, 4);
            if (!recent.length) return show("Ainda não há artigos publicados. Volte em breve!");
            status.hidden = true;
            container.append(...recent.map(card));
            EspectroCareActionGate.prepare(container);
        } catch {
            show("Não foi possível carregar os artigos. Verifique sua conexão e tente novamente.");
            retry.hidden = false;
        } finally {
            container.setAttribute("aria-busy", "false");
            container.hidden = !container.childElementCount;
        }
    }

    retry.addEventListener("click", load);
    load();
});
