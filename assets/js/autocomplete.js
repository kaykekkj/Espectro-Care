document.addEventListener("DOMContentLoaded", () => {

    const inputEstado = document.getElementById("estado");
    const inputCidade = document.getElementById("cidade");

    const listaEstado = document.getElementById("sugestoesEstado");
    const listaCidade = document.getElementById("sugestoesCidade");

    const API_ESTADOS =
        "https://servicodados.ibge.gov.br/api/v1/localidades/estados";

    const API_CIDADES =
        "https://servicodados.ibge.gov.br/api/v1/localidades/estados";

    let estados = [];
    let cidades = [];

    /*
    ================================================================
    CARREGAR ESTADOS
    ================================================================
    */

    async function carregarEstados() {

        try {

            const resposta = await fetch(
                `${API_ESTADOS}?orderBy=nome`
            );

            if (!resposta.ok) {
                throw new Error("Erro ao carregar estados.");
            }

            estados = await resposta.json();

        } catch (erro) {

            console.error("Erro:", erro);

            listaEstado.innerHTML = `
                <div class="item-autocomplete">
                    Não foi possível carregar os estados.
                </div>
            `;

        }
    }


    /*
    ================================================================
    MOSTRAR ESTADOS
    ================================================================
    */

    function mostrarEstados(texto = "") {

        const busca = texto
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "");

        const resultados = estados.filter(estado => {

            const nome = estado.nome
                .toLowerCase()
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "");

            const sigla = estado.sigla.toLowerCase();

            return (
                nome.includes(busca) ||
                sigla.includes(busca)
            );

        });

        listaEstado.innerHTML = "";

        if (resultados.length === 0) {

            listaEstado.innerHTML = `
                <div class="item-autocomplete">
                    Nenhum estado encontrado.
                </div>
            `;

            listaEstado.style.display = "block";
            return;
        }

        resultados.forEach(estado => {

            const item = document.createElement("div");

            item.classList.add("item-autocomplete");

            item.textContent = `${estado.nome} - ${estado.sigla}`;

            item.addEventListener("click", () => {

                selecionarEstado(estado);

            });

            listaEstado.appendChild(item);

        });

        listaEstado.style.display = "block";
    }


    /*
    ================================================================
    SELECIONAR ESTADO
    ================================================================
    */

    async function selecionarEstado(estado) {

        inputEstado.value = estado.nome;

        listaEstado.style.display = "none";

        // Limpa a cidade anterior
        inputCidade.value = "";

        // Habilita cidade
        inputCidade.disabled = false;

        inputCidade.placeholder = "Digite sua cidade";

        // Guarda o estado selecionado
        inputEstado.dataset.uf = estado.sigla;
        inputEstado.dataset.estadoId = estado.id;

        // Carrega cidades
        await carregarCidades(estado.id);

    }


    /*
    ================================================================
    CARREGAR CIDADES
    ================================================================
    */

    async function carregarCidades(idEstado) {

        try {

            inputCidade.disabled = true;
            inputCidade.placeholder = "Carregando cidades...";

            const resposta = await fetch(
                `${API_CIDADES}/${idEstado}/municipios?orderBy=nome`
            );

            if (!resposta.ok) {
                throw new Error("Erro ao carregar cidades.");
            }

            cidades = await resposta.json();

            inputCidade.disabled = false;
            inputCidade.placeholder = "Digite sua cidade";

        } catch (erro) {

            console.error("Erro:", erro);

            cidades = [];

            inputCidade.disabled = true;
            inputCidade.placeholder = "Não foi possível carregar as cidades.";

        }

    }


    /*
    ================================================================
    MOSTRAR CIDADES
    ================================================================
    */

    function mostrarCidades(texto = "") {

        const busca = texto
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "");

        const resultados = cidades.filter(cidade => {

            const nome = cidade.nome
                .toLowerCase()
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "");

            return nome.includes(busca);

        });

        listaCidade.innerHTML = "";

        if (resultados.length === 0) {

            listaCidade.innerHTML = `
                <div class="item-autocomplete">
                    Nenhuma cidade encontrada.
                </div>
            `;

            listaCidade.style.display = "block";
            return;
        }

        resultados.forEach(cidade => {

            const item = document.createElement("div");

            item.classList.add("item-autocomplete");

            item.textContent = cidade.nome;

            item.addEventListener("click", () => {

                inputCidade.value = cidade.nome;

                listaCidade.style.display = "none";

                inputCidade.dataset.cidadeId = cidade.id;

            });

            listaCidade.appendChild(item);

        });

        listaCidade.style.display = "block";
    }


    /*
    ================================================================
    EVENTOS - ESTADO
    ================================================================
    */

    inputEstado.addEventListener("focus", () => {

        mostrarEstados(inputEstado.value);

    });


    inputEstado.addEventListener("input", () => {

        /*
        Se o usuário alterar manualmente o estado,
        a cidade selecionada deixa de ser válida.
        */

        inputEstado.dataset.uf = "";
        inputEstado.dataset.estadoId = "";

        cidades = [];

        inputCidade.value = "";
        inputCidade.disabled = true;
        inputCidade.placeholder = "Selecione primeiro o estado";

        mostrarEstados(inputEstado.value);

    });


    /*
    ================================================================
    EVENTOS - CIDADE
    ================================================================
    */

    inputCidade.addEventListener("focus", () => {

        if (inputCidade.disabled) {
            return;
        }

        mostrarCidades(inputCidade.value);

    });


    inputCidade.addEventListener("input", () => {

        inputCidade.dataset.cidadeId = "";

        mostrarCidades(inputCidade.value);

    });


    /*
    ================================================================
    FECHAR LISTAS AO CLICAR FORA
    ================================================================
    */

    document.addEventListener("click", (evento) => {

        if (!evento.target.closest(".autocomplete")) {

            listaEstado.style.display = "none";
            listaCidade.style.display = "none";

        }

    });


    /*
    ================================================================
    TECLADO
    ================================================================
    */

    inputEstado.addEventListener("keydown", (evento) => {

        if (evento.key === "Escape") {

            listaEstado.style.display = "none";

        }

    });


    inputCidade.addEventListener("keydown", (evento) => {

        if (evento.key === "Escape") {

            listaCidade.style.display = "none";

        }

    });


    /*
    ================================================================
    INICIALIZAÇÃO
    ================================================================
    */

    carregarEstados();

});