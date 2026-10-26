(function () {
    const ufs = "AC AL AP AM BA CE DF ES GO MA MT MS MG PA PB PR PE PI RJ RN RS RO RR SC SP SE TO".split(" ");

    function bind(input, nameInput) {
        const prefix = input.id;
        const controls = document.createElement("div");
        controls.className = "registro-controles";
        controls.innerHTML = `
            <label for="${prefix}Conselho">Conselho profissional</label>
            <select id="${prefix}Conselho"><option value="outro">Outro conselho (CRP, CREFONO, CREFITO, CRN...)</option><option value="crm">CRM — Medicina</option></select>
            <div class="registro-crm" hidden>
                <label for="${prefix}Uf">UF do CRM</label>
                <select id="${prefix}Uf"><option value="">Selecione a UF do registro</option>${ufs.map(uf => `<option>${uf}</option>`).join("")}</select>
                <label class="registro-provisorio"><input type="checkbox" id="${prefix}Provisorio"> Inscrição provisória (P)</label>
            </div>`;
        input.before(controls);
        const council = controls.querySelector(`#${prefix}Conselho`);
        const uf = controls.querySelector(`#${prefix}Uf`);
        const provisional = controls.querySelector(`#${prefix}Provisorio`);
        const crmControls = controls.querySelector(".registro-crm");
        const help = document.createElement("p");
        help.id = `${prefix}Ajuda`;
        help.className = "registro-ajuda";
        input.setAttribute("aria-describedby", help.id);
        const status = document.createElement("p");
        status.className = "registro-status";
        status.setAttribute("role", "status");
        status.setAttribute("aria-live", "polite");
        const button = document.createElement("button");
        button.type = "button";
        button.className = "registro-consultar";
        button.textContent = "Consultar CRM no CFM";
        const official = document.createElement("a");
        official.href = "https://portal.cfm.org.br/busca-medicos/";
        official.target = "_blank";
        official.rel = "noopener noreferrer";
        official.textContent = "Abrir consulta oficial do CFM (nova aba)";
        official.className = "registro-fonte";
        input.after(help, button, status, official);

        function update() {
            const crm = council.value === "crm";
            crmControls.hidden = button.hidden = official.hidden = !crm;
            uf.required = crm;
            uf.disabled = provisional.disabled = !crm;
            input.maxLength = crm ? 7 : 80;
            input.inputMode = crm ? "numeric" : "text";
            input.placeholder = crm ? "Número do CRM, sem prefixo ou sufixo" : "Ex.: CRP 06/123456";
            help.textContent = crm
                ? "CRM: de 1 a 7 dígitos, diferente de zero. Informe a UF do registro, que pode ser diferente do seu endereço. A confirmação depende da consulta ao CFM. Para inscrições com prefixo de apresentação (52, EME/EMFE), informe só o número de consulta indicado pelo CFM."
                : "Informe a sigla e o número do seu conselho. As regras de CRM se aplicam somente a médicos.";
            status.textContent = "";
            validate();
        }

        function validate() {
            input.setCustomValidity(council.value === "crm" && (!/^\d{1,7}$/.test(input.value) || /^0+$/.test(input.value))
                ? "Informe um CRM de 1 a 7 dígitos, diferente de zero. Não inclua sigla, UF ou sufixo neste campo." : "");
            return input.checkValidity() && uf.checkValidity();
        }

        function value() {
            return council.value === "crm"
                ? `CRM-${uf.value} ${input.value.trim()}${provisional.checked ? "-P" : ""}`
                : input.value.trim();
        }

        function setValue(saved) {
            const text = String(saved || "");
            const match = text.match(/^CRM[-/ ]([A-Z]{2})\s+(\d{1,7})(-?P)?$/i);
            council.value = match || /^CRM/i.test(text) ? "crm" : "outro";
            input.value = match ? match[2] : text;
            uf.value = match ? match[1].toUpperCase() : "";
            provisional.checked = Boolean(match?.[3]);
            update();
        }

        council.addEventListener("change", update);
        [input, uf, provisional, nameInput].forEach(field => field.addEventListener("input", () => {
            status.textContent = "";
            validate();
        }));
        input.form.addEventListener("reset", () => setTimeout(() => setValue(""), 0));
        button.addEventListener("click", async () => {
            if (!validate()) { input.reportValidity(); uf.reportValidity(); return; }
            if (!nameInput.value.trim()) { nameInput.reportValidity(); nameInput.focus(); return; }
            const snapshot = value() + nameInput.value;
            button.disabled = true;
            status.textContent = "Consultando o CFM...";
            try {
                const response = await fetch(`${EspectroCareConfig.API_BASE_URL}/validacoes/crm`, {
                    method: "POST", headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ numero: input.value, uf: uf.value, nome: nameInput.value.trim() }),
                    signal: AbortSignal.timeout(20000)
                });
                let data;
                try { data = await response.json(); } catch { /* Backend anterior ou resposta sem JSON. */ }
                if (snapshot !== value() + nameInput.value) return;
                if (!response.ok) {
                    status.textContent = data?.mensagem || "Consulta indisponível. O CRM não foi confirmado; isso não significa que seja falso. Use a consulta oficial ou tente novamente.";
                    return;
                }
                status.textContent = data?.cadastroConsultado === true && typeof data.valido === "boolean"
                    ? data.mensagem
                    : "A consulta não confirmou este CRM. Tente novamente mais tarde.";
            } catch {
                if (snapshot === value() + nameInput.value) status.textContent = "Não foi possível consultar o CFM. O CRM não foi confirmado. Tente novamente mais tarde.";
            } finally { button.disabled = false; }
        });
        update();
        return Object.freeze({ value, setValue, validate });
    }
    window.EspectroCareRegistro = Object.freeze({ bind });
})();
