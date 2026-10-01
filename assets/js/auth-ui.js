(function () {
    let initialized = false;

    function makeProfileHref(tipoPerfil) {
        const page = window.EspectroCareAuth.profilePage(tipoPerfil);
        return location.pathname.includes("/pages/") ? page : `pages/${page}`;
    }

    function makeHomeHref() {
        return location.pathname.includes("/pages/") ? "../index.html" : "index.html";
    }

    function renderLoggedOut() {
        document.querySelectorAll("[data-auth-only]").forEach(el => el.hidden = true);
        document.querySelectorAll("[data-guest-only]").forEach(el => el.hidden = false);
    }

    function renderLoggedIn(user) {
        const conta = document.querySelector(".conta");
        if (conta) {
            conta.innerHTML = "";

            const perfil = document.createElement("a");
            perfil.className = "entrar auth-profile-link";
            perfil.href = makeProfileHref(user.tipoPerfil);
            perfil.textContent = "Meu Perfil";

            const sair = document.createElement("button");
            sair.type = "button";
            sair.className = "criar-conta auth-logout-button";
            sair.textContent = "Sair";
            sair.addEventListener("click", () => {
                window.EspectroCareAuth.clearSession();
                window.location.href = makeHomeHref();
            });

            conta.append(perfil, sair);
        }

        const entrarMobile = document.querySelector(".entrar-nav-mobile");
        if (entrarMobile) {
            entrarMobile.innerHTML = `<a href="${makeProfileHref(user.tipoPerfil)}">Meu Perfil</a>`;
            entrarMobile.style.display = "block";
        }

        const criarMobile = document.querySelector(".criar-nav-mobile");
        if (criarMobile) {
            criarMobile.innerHTML = '<button type="button" class="auth-mobile-logout">Sair</button>';
            criarMobile.style.display = "block";
            criarMobile.querySelector("button")?.addEventListener("click", () => {
                window.EspectroCareAuth.clearSession();
                window.location.href = makeHomeHref();
            });
        }

        document.querySelectorAll("[data-user-name]").forEach(el => {
            el.textContent = user.nome || "Usuário";
        });
    }

    async function init() {
        if (initialized || !window.EspectroCareAuth) return;
        initialized = true;

        if (!window.EspectroCareAuth.getToken()) {
            renderLoggedOut();
            return;
        }

        try {
            const user = await window.EspectroCareAuth.getCurrentUser();
            if (user) renderLoggedIn(user);
            else renderLoggedOut();
        } catch (error) {
            console.warn("Não foi possível atualizar a navbar autenticada.");
        }
    }

    window.EspectroCareAuthUI = { init };

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init, { once: true });
    } else {
        init();
    }
})();
