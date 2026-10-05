const cardsEquipe = document.getElementById("cardsEquipe");
    const btnAnterior = document.getElementById("btnAnterior");
    const btnProximo = document.getElementById("btnProximo");

    let posicao = 0;

    const cards = document.querySelectorAll(".card-equipe");

    function atualizarCarrossel() {

        const cardLargura = cards[0].offsetWidth;
        const gap = 40;

        const container = document.querySelector(".cards-equipe-container");

        const quantidadeVisivel = Math.floor(
            container.offsetWidth / (cardLargura + gap)
        );

        const maxPosicao = cards.length - quantidadeVisivel;

        if (posicao < 0) {
            posicao = 0;
        }

        if (posicao > maxPosicao) {
            posicao = maxPosicao;
        }

        cardsEquipe.style.transform =
            `translateX(-${posicao * (cardLargura + gap)}px)`;

        btnAnterior.disabled = posicao === 0;
        btnProximo.disabled = posicao >= maxPosicao;
    }

    btnProximo.addEventListener("click", () => {
        posicao++;
        atualizarCarrossel();
    });

    btnAnterior.addEventListener("click", () => {
        posicao--;
        atualizarCarrossel();
    });

    window.addEventListener("resize", atualizarCarrossel);

    atualizarCarrossel();

    const form = document.getElementById("formContato");
const mensagemSucesso = document.getElementById("mensagemSucesso");

form.addEventListener("submit", async function (event) {
    event.preventDefault();

    const dados = new FormData(form);

    try {
        const resposta = await fetch(form.action, {
            method: "POST",
            body: dados,
            headers: {
                "Accept": "application/json"
            }
        });

        if (resposta.ok) {
            form.style.display = "none";
            mensagemSucesso.style.display = "flex";
        } else {
            alert("Não foi possível enviar sua mensagem.");
        }

    } catch (erro) {
        console.error(erro);
        alert("Ocorreu um erro ao enviar sua mensagem.");
    }
});