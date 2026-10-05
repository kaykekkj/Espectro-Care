(function () {
    function prepare(root) {
        root.querySelectorAll("a[data-auth-action]").forEach(link => {
            const target = new URL(link.getAttribute("href"), location.href);
            if (target.origin !== location.origin) return;
            link.dataset.authTarget = `${target.pathname}${target.search}${target.hash}`;
            // Também protege abrir em nova aba quando o visitante ainda não tem token.
            if (!EspectroCareAuth.getToken()) {
                link.href = `login.html?redirect=${encodeURIComponent(link.dataset.authTarget)}`;
            }
        });
    }

    document.addEventListener("click", async event => {
        const link = event.target.closest("a[data-auth-action]");
        if (!link || event.defaultPrevented || event.button !== 0 ||
            event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
        event.preventDefault();
        if (link.dataset.busy) return;
        link.dataset.busy = "true";
        const target = link.dataset.authTarget;
        const status = document.getElementById("profissionaisStatus") ||
            document.getElementById("aprendizagemStatus");
        try {
            // Valida com a API: um token apenas salvo no navegador não basta.
            const user = await EspectroCareAuth.getCurrentUser();
            if (user) window.location.href = target;
            else window.location.href = `login.html?redirect=${encodeURIComponent(target)}`;
        } catch {
            if (status) {
                status.textContent = "Não foi possível validar sua sessão. Verifique sua conexão e tente novamente.";
                status.hidden = false;
            }
        } finally {
            delete link.dataset.busy;
        }
    });

    window.EspectroCareActionGate = Object.freeze({ prepare });
})();
