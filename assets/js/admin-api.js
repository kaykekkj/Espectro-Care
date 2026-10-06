(function () {
    async function request(path, options = {}) {
        const response = await EspectroCareAuth.authorizedFetch(path, { cache: "no-store", ...options });
        if (response.status === 401) {
            EspectroCareAuth.clearSession();
            throw new Error("Sua sessão expirou. Entre novamente.");
        }
        if (response.status === 403) throw new Error("Você não tem permissão para esta ação.");
        if (!response.ok) {
            let message;
            try { message = (await response.json()).mensagem; } catch {}
            throw new Error(message || "Não foi possível concluir a operação. Tente novamente.");
        }
        return response.status === 204 ? null : response.json();
    }
    window.EspectroCareAdminAPI = Object.freeze({ request });
})();
