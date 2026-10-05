(function () {
    let initialized = false;

    function isPagesPath() {
        return location.pathname.includes("/pages/");
    }

    function makePageHref(page) {
        return isPagesPath() ? page : `pages/${page}`;
    }

    function makeAreaHref() {
        return makePageHref(window.EspectroCareAuth.accountAreaPage());
    }

    function makeHomeHref() {
        return isPagesPath() ? "../index.html" : "index.html";
    }

    function initials(name) {
        return String(name || "U").trim().split(/\s+/).slice(0, 2)
            .map(part => part[0]?.toUpperCase() || "").join("");
    }

    function firstName(name) {
        return String(name || "Usuário").trim().split(/\s+/)[0] || "Usuário";
    }

    function profileLabel(tipoPerfil) {
        return tipoPerfil === "PROFISSIONAL" ? "Profissional" : "Responsável";
    }

    function applyVisibility(loggedIn) {
        document.querySelectorAll("[data-auth-only]").forEach(el => el.hidden = !loggedIn);
        document.querySelectorAll("[data-guest-only]").forEach(el => el.hidden = loggedIn);
    }

    function renderLoggedOut() {
        applyVisibility(false);
    }

    function renderLoggedIn(user) {
        applyVisibility(true);

        document.querySelectorAll("[data-user-name]").forEach(el => {
            el.textContent = user.nome || "Usuário";
        });
        document.querySelectorAll("[data-auth-area-link]").forEach(el => {
            el.href = makeAreaHref();
        });

        const conta = document.querySelector(".conta");
        if (conta) {
            conta.innerHTML = "";

            const area = document.createElement("a");
            area.className = "auth-user-control";
            area.href = makeAreaHref();
            area.setAttribute("aria-label", "Abrir minha área");

            const avatar = document.createElement("span");
            avatar.className = "auth-user-avatar";
            avatar.textContent = initials(user.nome);
            avatar.setAttribute("aria-hidden", "true");

            const identity = document.createElement("span");
            identity.className = "auth-user-identity";
            const name = document.createElement("strong");
            name.textContent = firstName(user.nome);
            const role = document.createElement("small");
            role.textContent = profileLabel(user.tipoPerfil);
            identity.append(name, role);
            area.append(avatar, identity);

            const sair = document.createElement("button");
            sair.type = "button";
            sair.className = "auth-logout-icon";
            sair.textContent = "Sair";
            sair.setAttribute("aria-label", "Sair da conta");
            sair.addEventListener("click", () => {
                window.EspectroCareAuth.clearSession();
                window.location.href = makeHomeHref();
            });

            conta.append(area, sair);
        }

        const entrarMobile = document.querySelector(".entrar-nav-mobile");
        if (entrarMobile) {
            entrarMobile.innerHTML = `<a href="${makeAreaHref()}">Minha área</a>`;
            entrarMobile.hidden = false;
        }

        const criarMobile = document.querySelector(".criar-nav-mobile");
        if (criarMobile) criarMobile.hidden = true;
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
            renderLoggedOut();
            console.warn("Não foi possível atualizar a interface autenticada.");
        }
    }

    window.EspectroCareAuthUI = { init };

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init, { once: true });
    } else {
        init();
    }
})();
