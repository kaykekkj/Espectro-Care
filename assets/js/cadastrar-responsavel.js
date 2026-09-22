console.log(document.getElementById("btnCadastrarResp"));
        document.getElementById("btnCadastrarResp").addEventListener("click", async () => {
            e.preventDefault();

    const senha = document.getElementById("senha").value;
    const confirmarSenha = document.getElementById("confirmarSenha").value;

    if (senha !== confirmarSenha) {
        alert("As senhas não coincidem!");
        return;
    }

    const usuario = {
        nome: document.getElementById("nome").value,
        email: document.getElementById("email").value,
        telefone: document.getElementById("tel").value,
        senha: senha,
        estado: document.getElementById("estado").value,
        cpf: document.getElementById("cpf").value
    };

    try {

        const resposta = await fetch(
            "https://espectrocare.onrender.com/cadastro/responsavel",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(usuario)
            }
        );

        if (resposta.ok) {
                    alert("Cadastro realizado com sucesso!");
                } else {
                    const erro = await resposta.text();
                    alert(erro || `Erro no cadastro. Código HTTP: ${resposta.status}`);
                }

    } catch (e) {
        console.error(e);
        alert("Erro ao conectar com o servidor.");
    }

});