const cidades = [
"Acre",
"Alagoas",
"Amapá",
"Amazonas",
"Bahia",
"Ceará",
"Espírito Santo",
"Goiás",
"Maranhão",
"Mato Grosso",
"Mato Grosso do Sul",
"Minas Gerais",
"Pará",
"Paraíba",
"Paraná",
"Pernambuco",
"Piauí",
"Rio de Janeiro",
"Rio Grande do Norte",
"Rio Grande do Sul",
"Rondônia",
"Roraima",
"Santa Catarina",
"São Paulo",
"Sergipe",
"Tocantins"
];

const input = document.getElementById("cidade");
const sugestoes = document.getElementById("sugestoes");

input.addEventListener("input", () => {
  const texto = input.value.toLowerCase();

  sugestoes.innerHTML = "";

  if (texto.length === 0) {
    sugestoes.style.display = "none";
    return;
  }

  const resultados = cidades.filter(cidade =>
    cidade.toLowerCase().includes(texto)
  );

  resultados.forEach(cidade => {
    const item = document.createElement("div");

    item.classList.add("sugestao");
    item.textContent = cidade;

    item.addEventListener("click", () => {
      input.value = cidade;
      sugestoes.style.display = "none";
    });

    sugestoes.appendChild(item);
  });

  sugestoes.style.display =
    resultados.length > 0 ? "block" : "none";
});

const cpf = document.getElementById("cpf");

cpf.addEventListener("input", (e) => {
    let valor = e.target.value;

    // remove tudo que não for número
    valor = valor.replace(/\D/g, "");

    // aplica a máscara
    valor = valor.replace(/(\d{3})(\d)/, "$1.$2");
    valor = valor.replace(/(\d{3})(\d)/, "$1.$2");
    valor = valor.replace(/(\d{3})(\d{1,2})$/, "$1-$2");

    e.target.value = valor;
});