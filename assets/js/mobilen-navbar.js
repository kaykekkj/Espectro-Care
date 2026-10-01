(function () {
    const currentScript = document.currentScript;
    const baseUrl = currentScript?.src ? new URL("./", currentScript.src) : null;

    function loadSibling(fileName) {
        return new Promise((resolve, reject) => {
            if (!baseUrl) return resolve();
            const src = new URL(fileName, baseUrl).href;
            if ([...document.scripts].some(script => script.src === src)) return resolve();

            const script = document.createElement("script");
            script.src = src;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    function initMobileMenu() {
        const menu = document.getElementById("mobile-menu");
        const navlinks = document.getElementById("navlinks");
        if (!menu || !navlinks) return;

        menu.setAttribute("role", "button");
        menu.setAttribute("tabindex", "0");
        menu.setAttribute("aria-label", "Abrir menu de navegação");
        menu.setAttribute("aria-expanded", "false");
        menu.setAttribute("aria-controls", "navlinks");

        const toggle = () => {
            const open = navlinks.classList.toggle("menu-aberto");
            menu.setAttribute("aria-expanded", String(open));
            menu.setAttribute("aria-label", open ? "Fechar menu de navegação" : "Abrir menu de navegação");
        };

        menu.addEventListener("click", toggle);
        menu.addEventListener("keydown", event => {
            if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                toggle();
            }
        });
    }

    async function initAuthUi() {
        try {
            if (!window.EspectroCareConfig) await loadSibling("api-config.js");
            if (!window.EspectroCareAuth) await loadSibling("auth.js");
            if (document.body?.dataset.authRequired === "true") {
                await loadSibling("auth-guard.js");
            }
            if (!window.EspectroCareAuthUI) await loadSibling("auth-ui.js");
            window.EspectroCareAuthUI?.init();
        } catch (error) {
            console.warn("Navbar autenticada indisponível.");
        }
    }

    document.querySelectorAll('footer a[href="#"]').forEach(link => {
        link.removeAttribute("href");
        link.setAttribute("aria-disabled", "true");
        link.setAttribute("title", "Funcionalidade ainda não disponível");
        link.classList.add("footer-link-disabled");
    });

    initMobileMenu();
    initAuthUi();
})();
