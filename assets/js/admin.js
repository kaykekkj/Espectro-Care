document.addEventListener("DOMContentLoaded", async () => {
    const status = document.getElementById("adminStatus");
    const request = EspectroCareAdminAPI.request;
    document.getElementById("sairAdmin").addEventListener("click", () => EspectroCareAuth.logout());
    const user = await EspectroCareAuth.requireAuth().catch(() => null);
    if (!user || user.tipoPerfil !== "ADMIN") { status.textContent = "Acesso permitido somente a administradores."; return; }
    document.getElementById("adminConteudo").hidden = false;
    let loadRevision = 0;
    async function load() {
        const revision = ++loadRevision;
        const list = document.getElementById("listaConvites");
        const invitations = await request("/api/admin/convites");
        if (revision !== loadRevision) return;
        list.replaceChildren();
        if (!invitations.length) { list.textContent = "Nenhum convite emitido."; return; }
        for (const invitation of invitations) {
            const row = document.createElement("div"); row.className = "admin-row";
            const state = invitation.utilizadoEm ? "Utilizado" : invitation.revogadoEm ? "Revogado"
                : new Date(invitation.expiraEm) <= new Date() ? "Expirado" : "Disponível";
            const text = document.createElement("p");
            text.textContent = `#${invitation.id} — ${invitation.email} — ${state}. Validade: ${new Date(invitation.expiraEm).toLocaleString("pt-BR")}`;
            row.append(text);
            if (state === "Disponível") {
                const button = document.createElement("button"); button.type = "button"; button.textContent = "Revogar";
                button.addEventListener("click", async () => {
                    if (!confirm("Revogar este convite? O link deixará de funcionar.")) return;
                    button.disabled = true;
                    try { await request(`/api/admin/convites/${invitation.id}`, { method: "DELETE" }); await load(); status.textContent = "Convite revogado."; }
                    catch (error) { status.textContent = error.message; button.disabled = false; }
                });
                row.append(button);
            }
            list.append(row);
        }
    }
    document.getElementById("gerarConvite").addEventListener("submit", async event => {
        event.preventDefault();
        const button = event.target.querySelector("button"); button.disabled = true;
        try {
            const result = await request("/api/admin/convites", { method: "POST",
                body: JSON.stringify({ email: document.getElementById("email").value.trim() }) });
            document.getElementById("linkConvite").value = result.link;
            document.getElementById("novoConvite").hidden = false;
            status.textContent = "Convite gerado. Copie e compartilhe o link com a pessoa autorizada."; await load();
        } catch (error) { status.textContent = error.message; }
        finally { button.disabled = false; }
    });
    document.getElementById("copiarConvite").addEventListener("click", async () => {
        const input = document.getElementById("linkConvite");
        try { await navigator.clipboard.writeText(input.value); status.textContent = "Link copiado."; }
        catch { input.select(); status.textContent = "Selecione o link e copie manualmente."; }
    });
    try { await load(); status.textContent = "Gerencie os convites e acesse a Aprendizagem para editar postagens."; }
    catch (error) { status.textContent = error.message; }
});
