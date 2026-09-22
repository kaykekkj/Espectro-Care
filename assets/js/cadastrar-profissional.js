console.log(document.getElementById("btnCadastrarProf"));
        document.getElementById("btnCadastrarProf").addEventListener("click", async () => {
            e.preventDefaut();

        const senha = document.getElementById("senhaProf").value;
        const confirmarSenha = document.getElementById("ConfirmarSenhaProf").value;

        if (senha !== confirmarSenha) {
            alert("As senhas não coincidem!");
            return;
        }

        const usuario = {
            nome: document.getElementById("nomeProf").value,
            email: document.getElementById("emailProf").value,
            telefone: document.getElementById("telProf").value,
            senha: senha,
            estado: document.getElementById("estadoProf").value,
            cpf: document.getElementById("cpf").value,
            numRegistro: document.getElementById("registro").value
        };

        try {

            const resposta = await fetch(
                "https://espectrocare.onrender.com/cadastro/profissional",
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