document.addEventListener("DOMContentLoaded", () => {
    const inputEstado = document.getElementById("estado");
    const inputCidade = document.getElementById("cidade");
    const listaEstado = document.getElementById("sugestoesEstado");
    const listaCidade = document.getElementById("sugestoesCidade");

    if (!inputEstado || !inputCidade || !listaEstado || !listaCidade) return;

    const API_ESTADOS = "https://servicodados.ibge.gov.br/api/v1/localidades/estados";
    let estados = [];
    let cidades = [];
    let activeStateIndex = -1;
    let activeCityIndex = -1;

    inputEstado.setAttribute("role", "combobox");
    inputEstado.setAttribute("aria-autocomplete", "list");
    inputEstado.setAttribute("aria-controls", listaEstado.id);
    inputEstado.setAttribute("aria-expanded", "false");
    inputCidade.setAttribute("role", "combobox");
    inputCidade.setAttribute("aria-autocomplete", "list");
    inputCidade.setAttribute("aria-controls", listaCidade.id);
    inputCidade.setAttribute("aria-expanded", "false");
    listaEstado.setAttribute("role", "listbox");
    listaCidade.setAttribute("role", "listbox");

    const normalize = value => String(value || "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");

    function closeList(input, list) {
        list.style.display = "none";
        input.setAttribute("aria-expanded", "false");
        input.removeAttribute("aria-activedescendant");
    }

    function openList(input, list) {
        list.style.display = "block";
        input.setAttribute("aria-expanded", "true");
    }

    function renderMessage(input, list, message) {
        list.innerHTML = `<div class="item-autocomplete item-autocomplete-status" role="status">${message}</div>`;
        openList(input, list);
    }

    async function loadStates() {
        renderMessage(inputEstado, listaEstado, "Carregando estados...");
        try {
            const response = await fetch(`${API_ESTADOS}?orderBy=nome`);
            if (!response.ok) throw new Error();
            estados = await response.json();
            closeList(inputEstado, listaEstado);
        } catch (error) {
            estados = [];
            renderMessage(inputEstado, listaEstado, "Não foi possível carregar os estados. Tente novamente.");
        }
    }

    async function loadCities(stateId) {
        cidades = [];
        inputCidade.value = "";
        inputCidade.dataset.cidadeId = "";
        inputCidade.disabled = true;
        inputCidade.placeholder = "Carregando cidades...";
        try {
            const response = await fetch(`${API_ESTADOS}/${stateId}/municipios?orderBy=nome`);
            if (!response.ok) throw new Error();
            cidades = await response.json();
            inputCidade.disabled = false;
            inputCidade.placeholder = "Digite sua cidade";
        } catch (error) {
            inputCidade.disabled = true;
            inputCidade.placeholder = "Não foi possível carregar as cidades";
            renderMessage(inputCidade, listaCidade, "Erro de rede ao carregar cidades.");
        }
    }

    async function selectState(state) {
        inputEstado.value = state.nome;
        inputEstado.dataset.uf = state.sigla;
        inputEstado.dataset.estadoId = String(state.id);
        inputEstado.setCustomValidity("");
        closeList(inputEstado, listaEstado);
        await loadCities(state.id);
    }

    function selectCity(city) {
        inputCidade.value = city.nome;
        inputCidade.dataset.cidadeId = String(city.id);
        inputCidade.setCustomValidity("");
        closeList(inputCidade, listaCidade);
    }

    function renderStates(search = "") {
        const term = normalize(search);
        const results = estados.filter(state =>
            normalize(state.nome).includes(term) || state.sigla.toLowerCase().includes(term)
        ).slice(0, 30);

        listaEstado.innerHTML = "";
        activeStateIndex = -1;
        if (!results.length) return renderMessage(inputEstado, listaEstado, "Nenhum estado encontrado.");

        results.forEach((state, index) => {
            const item = document.createElement("button");
            item.type = "button";
            item.className = "item-autocomplete";
            item.id = `estado-option-${index}`;
            item.setAttribute("role", "option");
            item.textContent = `${state.nome} - ${state.sigla}`;
            item.addEventListener("click", () => selectState(state));
            listaEstado.appendChild(item);
        });
        openList(inputEstado, listaEstado);
    }

    function renderCities(search = "") {
        const term = normalize(search);
        const results = cidades.filter(city => normalize(city.nome).includes(term)).slice(0, 40);

        listaCidade.innerHTML = "";
        activeCityIndex = -1;
        if (!results.length) return renderMessage(inputCidade, listaCidade, "Nenhuma cidade encontrada.");

        results.forEach((city, index) => {
            const item = document.createElement("button");
            item.type = "button";
            item.className = "item-autocomplete";
            item.id = `cidade-option-${index}`;
            item.setAttribute("role", "option");
            item.textContent = city.nome;
            item.addEventListener("click", () => selectCity(city));
            listaCidade.appendChild(item);
        });
        openList(inputCidade, listaCidade);
    }

    function navigate(input, list, direction, currentIndexSetter) {
        const options = [...list.querySelectorAll('[role="option"]')];
        if (!options.length) return -1;
        let current = options.findIndex(option => option.classList.contains("active"));
        current = (current + direction + options.length) % options.length;
        options.forEach(option => option.classList.remove("active"));
        options[current].classList.add("active");
        input.setAttribute("aria-activedescendant", options[current].id);
        options[current].scrollIntoView({ block: "nearest" });
        currentIndexSetter(current);
        return current;
    }

    inputEstado.addEventListener("focus", () => renderStates(inputEstado.value));
    inputEstado.addEventListener("input", () => {
        inputEstado.dataset.uf = "";
        inputEstado.dataset.estadoId = "";
        inputEstado.setCustomValidity("Selecione um estado válido da lista.");
        inputCidade.value = "";
        inputCidade.dataset.cidadeId = "";
        inputCidade.disabled = true;
        inputCidade.placeholder = "Selecione primeiro o estado";
        cidades = [];
        renderStates(inputEstado.value);
    });
    inputEstado.addEventListener("blur", () => {
        if (inputEstado.value && !inputEstado.dataset.estadoId) {
            inputEstado.setCustomValidity("Selecione um estado válido da lista.");
        }
    });
    inputEstado.addEventListener("keydown", event => {
        if (event.key === "ArrowDown") {
            event.preventDefault();
            navigate(inputEstado, listaEstado, 1, value => activeStateIndex = value);
        } else if (event.key === "ArrowUp") {
            event.preventDefault();
            navigate(inputEstado, listaEstado, -1, value => activeStateIndex = value);
        } else if (event.key === "Enter" && activeStateIndex >= 0) {
            const option = listaEstado.querySelectorAll('[role="option"]')[activeStateIndex];
            if (option) { event.preventDefault(); option.click(); }
        } else if (event.key === "Escape") {
            closeList(inputEstado, listaEstado);
        }
    });

    inputCidade.addEventListener("focus", () => {
        if (!inputCidade.disabled) renderCities(inputCidade.value);
    });
    inputCidade.addEventListener("input", () => {
        inputCidade.dataset.cidadeId = "";
        inputCidade.setCustomValidity("Selecione uma cidade válida da lista.");
        renderCities(inputCidade.value);
    });
    inputCidade.addEventListener("blur", () => {
        if (inputCidade.value && !inputCidade.dataset.cidadeId) {
            inputCidade.setCustomValidity("Selecione uma cidade válida da lista.");
        }
    });
    inputCidade.addEventListener("keydown", event => {
        if (event.key === "ArrowDown") {
            event.preventDefault();
            navigate(inputCidade, listaCidade, 1, value => activeCityIndex = value);
        } else if (event.key === "ArrowUp") {
            event.preventDefault();
            navigate(inputCidade, listaCidade, -1, value => activeCityIndex = value);
        } else if (event.key === "Enter" && activeCityIndex >= 0) {
            const option = listaCidade.querySelectorAll('[role="option"]')[activeCityIndex];
            if (option) { event.preventDefault(); option.click(); }
        } else if (event.key === "Escape") {
            closeList(inputCidade, listaCidade);
        }
    });

    document.addEventListener("click", event => {
        if (!event.target.closest(".autocomplete")) {
            closeList(inputEstado, listaEstado);
            closeList(inputCidade, listaCidade);
        }
    });

    loadStates();
});
