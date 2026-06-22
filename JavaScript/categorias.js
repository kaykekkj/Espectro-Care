function categoriaSelecionada(ID) {
    let categoriaSel = document.getElementById(ID);

    if (ID === "todas") {
        document.querySelectorAll(".categoria")
        .forEach(div => {
            div.classList.remove("categoriaSelecionado");
        });

        categoriaSel.classList.toggle("categoriaSelecionado");
        return;
    }

    document.getElementById("todas")
    .classList.remove("categoriaSelecionado");

    categoriaSel.classList.toggle("categoriaSelecionado");
}