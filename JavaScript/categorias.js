function categoriaSelecionada(ID) {
    const categoriaSel = document.getElementById(ID);
    const todas = document.getElementById("todas");

    if (ID === "todas") {
        if (todas.classList.contains("categoriaSelecionado")) {
            todas.classList.remove("categoriaSelecionado");
        } else {
            document.querySelectorAll(".container-categorias div")
                .forEach(div => div.classList.remove("categoriaSelecionado"));

            todas.classList.add("categoriaSelecionado");
        }
        return;
    }

    todas.classList.remove("categoriaSelecionado");

    categoriaSel.classList.toggle("categoriaSelecionado");
}