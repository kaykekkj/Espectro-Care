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

