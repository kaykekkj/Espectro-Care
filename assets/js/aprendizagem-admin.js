(function () {
    let admin = false;
    let reload;
    let editingId = null;
    let previewUrl;
    const imageInput = document.getElementById("postagemImagem");
    const preview = document.getElementById("postagemPreview");
    function clearPreview() {
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        previewUrl = null; preview.removeAttribute("src"); preview.hidden = true;
    }
    function readImage(file) {
        if (!file || !["image/jpeg", "image/png"].includes(file.type) || file.size > 2 * 1024 * 1024)
            return Promise.reject(new Error("Envie JPG ou PNG de até 2 MB."));
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onerror = () => reject(new Error("Não foi possível ler a imagem."));
            reader.onload = () => resolve(reader.result); reader.readAsDataURL(file);
        });
    }
    imageInput.addEventListener("change", () => {
        clearPreview();
        if (imageInput.files[0]) {
            previewUrl = URL.createObjectURL(imageInput.files[0]); preview.src = previewUrl; preview.hidden = false;
        }
    });
    document.getElementById("editorPostagem").addEventListener("close", clearPreview);
    const request = (...args) => EspectroCareAdminAPI.request(...args);
    function status(message) {
        const element = document.getElementById("adminAprendizagemStatus");
        element.textContent = message; element.hidden = !message;
    }
    async function open(id = null) {
        editingId = id;
        clearPreview(); imageInput.required = !id;
        const form = document.getElementById("formPostagem"); form.reset();
        document.getElementById("editorStatus").textContent = "";
        document.getElementById("editorTitulo").textContent = id ? "Editar postagem" : "Criar postagem";
        try {
            if (id) {
                const article = await request(`/api/aprendizagem/${id}`);
                document.getElementById("postagemTitulo").value = article.titulo;
                document.getElementById("postagemConteudo").value = article.conteudoHtml;
                document.getElementById("postagemResumo").value = article.resumo || "";
                document.getElementById("postagemReferencias").value = article.referencias || "";
                imageInput.required = !article.imagemUrl;
                if (article.imagemUrl) { preview.src = EspectroCareConfig.API_BASE_URL + article.imagemUrl; preview.hidden = false; }
            }
            document.getElementById("editorPostagem").showModal();
        } catch (error) { status(error.message); }
    }
    async function init(refresh) {
        reload = refresh;
        const user = await EspectroCareAuth.getCurrentUser().catch(() => null);
        admin = user?.tipoPerfil === "ADMIN";
        if (!admin) return;
        document.getElementById("adminAprendizagem").hidden = false;
        const dialog = document.getElementById("editorPostagem");
        document.getElementById("novaPostagem").addEventListener("click", () => open());
        document.getElementById("cancelarPostagem").addEventListener("click", () => dialog.close());
        document.getElementById("formPostagem").addEventListener("submit", async event => {
            event.preventDefault();
            const button = event.target.querySelector('[type="submit"]'); button.disabled = true;
            try {
                await request(editingId ? `/api/aprendizagem/${editingId}` : "/api/aprendizagem", {
                    method: editingId ? "PUT" : "POST", body: JSON.stringify({
                        titulo: document.getElementById("postagemTitulo").value.trim(),
                        conteudoHtml: document.getElementById("postagemConteudo").value,
                        resumo: document.getElementById("postagemResumo").value.trim(),
                        referencias: document.getElementById("postagemReferencias").value.trim(),
                        imagemData: imageInput.files[0] ? await readImage(imageInput.files[0]) : null
                    })
                });
                dialog.close(); status("Postagem salva com sucesso."); await reload();
            } catch (error) { document.getElementById("editorStatus").textContent = error.message; status(error.message); }
            finally { button.disabled = false; }
        });
    }
    function controls(card, article) {
        if (!admin) return;
        const actions = document.createElement("div"); actions.className = "admin-actions";
        const edit = document.createElement("button"); edit.type = "button"; edit.textContent = "Editar";
        edit.setAttribute("aria-label", `Editar ${article.titulo}`); edit.addEventListener("click", () => open(article.id));
        const remove = document.createElement("button"); remove.type = "button"; remove.textContent = "Excluir";
        remove.className = "admin-delete"; remove.setAttribute("aria-label", `Excluir ${article.titulo}`);
        remove.addEventListener("click", async () => {
            if (!confirm(`Excluir a postagem “${article.titulo}”? Esta ação remove também os vínculos com os anexos.`)) return;
            remove.disabled = true;
            try { await request(`/api/aprendizagem/${article.id}`, { method: "DELETE" }); status("Postagem excluída."); await reload(); }
            catch (error) { status(error.message); remove.disabled = false; }
        });
        actions.append(edit, remove); card.querySelector(".api-learning-content").append(actions);
    }
    window.EspectroCareLearningAdmin = Object.freeze({ init, controls });
})();
