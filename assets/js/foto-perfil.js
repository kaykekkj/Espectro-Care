(function () {
    function initials(name) {
        return String(name || "U").trim().split(/\s+/).slice(0, 2)
            .map(part => part[0]?.toUpperCase() || "").join("");
    }

    function render(element, photo, name) {
        element.replaceChildren();
        if (typeof photo === "string" && (/^data:image\/(jpeg|png);base64,[A-Za-z0-9+/=]+$/.test(photo)
                || /^\/api\/profissionais\/\d+\/foto$/.test(photo))) {
            const img = document.createElement("img");
            img.src = photo.startsWith("/") ? `${EspectroCareConfig.API_BASE_URL}${photo}` : photo;
            img.alt = `Foto de ${name || "perfil"}`;
            img.addEventListener("error", () => {
                if (img.parentNode === element) element.textContent = initials(name);
            }, { once: true });
            element.appendChild(img);
        } else element.textContent = initials(name);
    }

    async function compact(file) {
        if (!/^image\/(jpeg|png|webp)$/.test(file.type)) {
            throw new Error("Escolha uma imagem JPG, PNG ou WebP.");
        }
        if (file.size > 5 * 1024 * 1024) throw new Error("A imagem deve ter no máximo 5 MB.");
        const url = URL.createObjectURL(file);
        try {
            const image = new Image();
            await new Promise((resolve, reject) => {
                image.onload = resolve;
                image.onerror = () => reject(new Error("Não foi possível abrir esta imagem. Escolha outro arquivo."));
                image.src = url;
            });
            if (!image.naturalWidth || !image.naturalHeight || image.naturalWidth * image.naturalHeight > 24000000) {
                throw new Error("Escolha uma imagem com resolução menor (até 24 megapixels).");
            }
            const size = Math.min(image.naturalWidth, image.naturalHeight);
            const canvas = document.createElement("canvas");
            canvas.width = canvas.height = 256;
            const ctx = canvas.getContext("2d");
            if (!ctx) throw new Error("Não foi possível preparar a foto neste navegador.");
            ctx.fillStyle = "#fff";
            ctx.fillRect(0, 0, 256, 256);
            ctx.drawImage(image, (image.naturalWidth - size) / 2, (image.naturalHeight - size) / 2,
                size, size, 0, 0, 256, 256);
            const result = canvas.toDataURL("image/jpeg", 0.85);
            if (result.length > 180000) throw new Error("Não foi possível reduzir esta imagem. Escolha outra foto.");
            return result;
        } finally { URL.revokeObjectURL(url); }
    }

    async function bind(button, user) {
        if (!button || button.dataset.photoBound) return;
        button.dataset.photoBound = "true";
        button.disabled = true;
        const feedback = document.getElementById("fotoPerfilStatus");
        const show = (message, type = "info") => {
            if (feedback) EspectroCareForms.setFeedback(feedback, message, type);
        };
        const input = document.createElement("input");
        input.type = "file";
        input.accept = "image/jpeg,image/png,image/webp";
        input.hidden = true;
        button.after(input);
        render(button, null, user.nome);

        async function authFailed(response) {
            if (response.status !== 401) return false;
            EspectroCareAuth.clearSession();
            await EspectroCareAuth.requireAuth();
            return true;
        }

        try {
            const response = await EspectroCareAuth.authorizedFetch("/api/conta/foto");
            if (await authFailed(response)) return;
            if (!response.ok) throw new Error();
            render(button, (await response.json()).fotoPerfil, user.nome);
        } catch {
            show("Não foi possível carregar sua foto. Verifique a conexão e se a API foi atualizada.", "error");
        } finally { button.disabled = false; }

        button.addEventListener("click", () => input.click());
        input.addEventListener("change", async () => {
            const file = input.files?.[0];
            if (!file) return;
            button.disabled = true;
            button.setAttribute("aria-busy", "true");
            show("Salvando sua foto...");
            try {
                const photo = await compact(file);
                const response = await EspectroCareAuth.authorizedFetch("/api/conta/foto", {
                    method: "PUT", body: JSON.stringify({ fotoPerfil: photo })
                });
                if (await authFailed(response)) return;
                if (!response.ok) {
                    throw new Error(response.status === 400
                        ? "A imagem não foi aceita. Escolha outra foto."
                        : "Não foi possível salvar sua foto. Tente novamente.");
                }
                const savedPhoto = (await response.json()).fotoPerfil;
                render(button, savedPhoto, user.nome);
                window.dispatchEvent(new CustomEvent("espectrocare:foto-atualizada", { detail: { fotoPerfil: savedPhoto } }));
                show("Foto de perfil atualizada com sucesso.", "success");
            } catch (error) {
                show(error.message || "Não foi possível salvar sua foto. Tente novamente.", "error");
            } finally {
                button.disabled = false;
                button.removeAttribute("aria-busy");
                input.value = "";
            }
        });
    }

    window.EspectroCarePhoto = Object.freeze({ bind, compact, render });
})();
