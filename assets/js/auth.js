(function () {
    const TOKEN_KEY = "token";
    const EMAIL_KEY = "email";
    const PROFILE_KEY = "tipoPerfil";

    let currentUserPromise = null;

    function apiBaseUrl() {
        if (!window.EspectroCareConfig?.API_BASE_URL) {
            throw new Error("Configuração da API não carregada.");
        }
        return window.EspectroCareConfig.API_BASE_URL;
    }

    function getToken() {
        return localStorage.getItem(TOKEN_KEY);
    }

    function setSession({ token, email, tipoPerfil }) {
        if (token) {
            localStorage.setItem(TOKEN_KEY, token);
            currentUserPromise = null;
        }
        if (email) localStorage.setItem(EMAIL_KEY, email);
        if (tipoPerfil) localStorage.setItem(PROFILE_KEY, tipoPerfil);
    }

    function clearSession() {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(EMAIL_KEY);
        localStorage.removeItem(PROFILE_KEY);
        localStorage.removeItem("token_jwt");
        currentUserPromise = null;
    }

    function profilePage(tipoPerfil) {
        if (tipoPerfil === "PROFISSIONAL") return "userProfissional.html";
        if (tipoPerfil === "RESPONSAVEL") return "userResponsavel.html";
        return "login.html";
    }

    function accountAreaPage() {
        return "area-usuario.html";
    }

    function loginUrl() {
        const current = `${location.pathname}${location.search}`;
        return `login.html?redirect=${encodeURIComponent(current)}`;
    }

    async function authorizedFetch(path, options = {}) {
        const token = getToken();
        const headers = new Headers(options.headers || {});

        if (token) headers.set("Authorization", `Bearer ${token}`);
        if (options.body && !headers.has("Content-Type")) {
            headers.set("Content-Type", "application/json");
        }

        return fetch(`${apiBaseUrl()}${path}`, { ...options, headers });
    }

    function getCurrentUser() {
        const token = getToken();
        if (!token) return Promise.resolve(null);

        if (currentUserPromise) return currentUserPromise;

        currentUserPromise = (async () => {
            const response = await authorizedFetch("/api/auth/me");

            if (response.status === 401) {
                clearSession();
                return null;
            }

            if (!response.ok) {
                throw new Error("Não foi possível validar sua sessão.");
            }

            const user = await response.json();
            if (user.tipoPerfil) localStorage.setItem(PROFILE_KEY, user.tipoPerfil);
            if (user.email) localStorage.setItem(EMAIL_KEY, user.email);
            return user;
        })();

        currentUserPromise.catch(() => {
            currentUserPromise = null;
        });

        return currentUserPromise;
    }

    async function requireAuth() {
        const token = getToken();
        if (!token) {
            window.location.replace(loginUrl());
            return null;
        }

        try {
            const user = await getCurrentUser();
            if (!user) {
                window.location.replace(loginUrl());
                return null;
            }
            return user;
        } catch (error) {
            throw error;
        }
    }

    function logout() {
        clearSession();
        window.location.href = "../index.html";
    }

    window.EspectroCareAuth = Object.freeze({
        getToken,
        setSession,
        clearSession,
        profilePage,
        accountAreaPage,
        authorizedFetch,
        getCurrentUser,
        requireAuth,
        logout
    });
})();
