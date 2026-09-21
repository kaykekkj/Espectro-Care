function abrirPerfil(numero) {
  let Card = document.getElementById(numero);

  if (!Card) return;

  let Nome = Card.querySelector('h3') ? Card.querySelector('h3').textContent : '';
  let Valor = Card.querySelector('.preco strong') ? Card.querySelector('.preco strong').textContent.replace(/\D/g, '') : '';
  let Atividade = Card.querySelector('#atividade') ? Card.querySelector('#atividade').textContent : '';
  let Modelo = Card.querySelector('#modelo') ? Card.querySelector('#modelo').textContent : '';
  let Img = Card.querySelector('.avatar-iniciais') ? Card.querySelector('.avatar-iniciais').src : '';

  localStorage.setItem('perfil_nome', Nome);
  localStorage.setItem('perfil_valor', Valor);
  localStorage.setItem('perfil_atividade', Atividade);
  localStorage.setItem('perfil_modelo', Modelo);
  localStorage.setItem('perfil_img', Img);
  
}

window.addEventListener('DOMContentLoaded', () => {
  const elemNome = document.querySelector('.info-name');

  if (elemNome) {
    let nome = localStorage.getItem('perfil_nome');
    let valor = localStorage.getItem('perfil_valor');
    let atividade = localStorage.getItem('perfil_atividade');
    let modelo = localStorage.getItem('perfil_modelo');
    let img = localStorage.getItem('perfil_img');

    if (nome) elemNome.textContent = nome;
    if (valor) document.querySelector('.info-price-val').textContent = `R$ ${valor}`;
    if (modelo) document.querySelector('.tag-plain').textContent = modelo;
    if (atividade) document.querySelector('.tag-pill').textContent = atividade;
    if (img && document.querySelector('.avatar-img')) document.querySelector('.avatar-img').src = img;
  }

  const tagPill = document.querySelector('.tag-pill');
  const Avatar = document.querySelector('.avatar-ring');

  if (tagPill) {
    if (tagPill.textContent === "XXXXXX" || tagPill.textContent.trim() === "") {
      tagPill.className = "tag-pill-offline";
      tagPill.textContent = "Offline";
      Avatar.className = "avatar-ring-offline";
    }
  }
});

function abrirPerfil(numero) {

    const card = document.getElementById(numero);

    if (!card) return;

    const nome = card.querySelector("h3")?.textContent || "";
    const valor = card.querySelector(".preco strong")?.textContent.replace(/\D/g, "") || "";
    const atividade = card.querySelector("#atividade")?.textContent || "";
    const modelo = card.querySelector("#modelo")?.textContent || "";
    const img = card.querySelector(".avatar-iniciais")?.src || "";

    localStorage.setItem("perfil_nome", nome);
    localStorage.setItem("perfil_valor", valor);
    localStorage.setItem("perfil_atividade", atividade);
    localStorage.setItem("perfil_modelo", modelo);
    localStorage.setItem("perfil_img", img);

}

window.addEventListener("DOMContentLoaded", () => {

    // ==========================
    // CARREGA AS INFORMAÇÕES
    // ==========================

    const nome = localStorage.getItem("perfil_nome");
    const valor = localStorage.getItem("perfil_valor");
    const atividade = localStorage.getItem("perfil_atividade");
    const modelo = localStorage.getItem("perfil_modelo");
    const img = localStorage.getItem("perfil_img");

    if (document.querySelector(".info-name"))
        document.querySelector(".info-name").textContent = nome || "XXXXXX";

    if (document.querySelector(".info-price-val"))
        document.querySelector(".info-price-val").textContent = valor ? `R$ ${valor}` : "R$ XXXXXX";

    if (document.querySelector(".tag-plain"))
        document.querySelector(".tag-plain").textContent = modelo || "XXXXXX";

    if (document.querySelector(".tag-pill"))
        document.querySelector(".tag-pill").textContent = atividade || "XXXXXX";

    if (img && document.querySelector(".avatar-img"))
        document.querySelector(".avatar-img").src = img;

    // ==========================
    // STATUS ONLINE/OFFLINE
    // ==========================

    const tag = document.querySelector(".tag-pill");
    const avatar = document.querySelector(".avatar-ring");

    if (tag && avatar) {

        if (tag.textContent.trim() === "" || tag.textContent === "XXXXXX") {

            tag.classList.remove("tag-pill");
            tag.classList.add("tag-pill-offline");
            tag.textContent = "Offline";

            avatar.classList.remove("avatar-ring");
            avatar.classList.add("avatar-ring-offline");

        }

    }

    // ==========================
    // ABAS
    // ==========================

    const tabs = document.querySelectorAll(".tab");
    const paginas = document.querySelectorAll(".page");
    const indicator = document.querySelector(".indicator");

    function moverIndicador(tab){

        if(!tab || !indicator) return;

        indicator.style.width = tab.offsetWidth + "px";
        indicator.style.left = tab.offsetLeft + "px";

    }

    moverIndicador(document.querySelector(".tab.active"));

    window.trocarPagina = function(idPagina, botao){

        paginas.forEach((pagina)=>{

            pagina.classList.remove("active-page");

        });

        tabs.forEach((tab)=>{

            tab.classList.remove("active");

        });

        const pagina = document.getElementById(idPagina);

        if(pagina){

            pagina.classList.add("active-page");

        }

        botao.classList.add("active");

        moverIndicador(botao);

    }

    window.addEventListener("resize", ()=>{

        moverIndicador(document.querySelector(".tab.active"));

    });

});

