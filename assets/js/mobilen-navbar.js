/* Menu hambúrguer (mobile)
   Padrão: adiciona um ouvinte de evento ao botão e alterna a classe
   "menu-aberto" no menu (#navlinks). O CSS controla a abertura/fechamento. */

document.addEventListener("DOMContentLoaded", function () {
    // Botão do hambúrguer
    var menuHamburguer = document.querySelector("#mobile-menu");
    // Menu de links
    var navLinks = document.querySelector("#navlinks");

    if (menuHamburguer && navLinks) {
        // Ao clicar no botão, alterna a classe que abre/fecha o menu
        menuHamburguer.addEventListener("click", function () {
            navLinks.classList.toggle("menu-aberto");
        });

        // Fecha o menu ao clicar em qualquer link dentro dele
        var links = navLinks.querySelectorAll("a");
        links.forEach(function (link) {
            link.addEventListener("click", function () {
                navLinks.classList.remove("menu-aberto");
            });
        });
    }
});

