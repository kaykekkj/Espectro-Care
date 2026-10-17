(() => {
    const track = document.getElementById("cardsEquipe");
    if (!track) return;
    const previous = document.getElementById("btnAnterior"), next = document.getElementById("btnProximo");
    const viewport = track.parentElement;
    const originals = [...track.children];
    const count = originals.length;
    if (!count) return;
    let position = count, moving = false, timer;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    const clone = card => {
        const copy = card.cloneNode(true); copy.setAttribute("aria-hidden", "true"); copy.inert = true;
        copy.querySelectorAll("[id]").forEach(el => el.removeAttribute("id")); copy.removeAttribute("id"); return copy;
    };
    track.prepend(...originals.map(clone)); track.append(...originals.map(clone));
    viewport.setAttribute("role", "region"); viewport.setAttribute("aria-label", "Equipe EspectroCare, carrossel infinito");
    previous.setAttribute("aria-label", "Integrante anterior"); next.setAttribute("aria-label", "Próximo integrante");
    function render(animate = false) {
        const step = originals[0].getBoundingClientRect().width + (parseFloat(getComputedStyle(track).columnGap) || 0);
        track.style.transition = animate && !reduced.matches ? "transform 350ms ease" : "none";
        track.style.transform = `translateX(-${position * step}px)`;
    }
    function settle() {
        clearTimeout(timer);
        if (position >= count * 2) position -= count;
        if (position < count) position += count;
        render(); moving = false;
    }
    function move(direction) {
        if (moving || count < 2) return;
        moving = true; position += direction; render(true);
        if (reduced.matches) settle(); else timer = setTimeout(settle, 420);
    }
    previous.disabled = next.disabled = count < 2;
    previous.addEventListener("click", () => move(-1)); next.addEventListener("click", () => move(1));
    track.addEventListener("transitionend", event => { if (event.target === track && event.propertyName === "transform") settle(); });
    new ResizeObserver(settle).observe(viewport);
    render();
})();

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