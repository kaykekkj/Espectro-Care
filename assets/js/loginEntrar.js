document.querySelector(".botao-logar").addEventListener("click", async () => {

    const email = document.querySelector(".email").value;
    const senha = document.querySelector(".senha").value;

    try {

        const response = await fetch(
            "https://espectrocare.onrender.com/auth/login",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    email,
                    senha
                })
            }
        );

        if (!response.ok) {
            const mensagem = await response.text();
            console.log(mensagem);

            // Exibe o erro retornado pela API ou uma mensagem padrão se o retorno for vazio
            alert(mensagem || `Erro ao realizar login. Status: ${response.status}`);
            return;
        }

        const data = await response.json();

        console.log(data);

        // Salva os dados no localStorage
        localStorage.setItem("token", data.token);
        localStorage.setItem("email", data.email);
        
        // Exemplo: se o backend retornar 'tipoPerfil' ou 'tipo' ou 'role'
        // Salvar o tipo de perfil também é uma boa prática:
        if (data.tipo) {
            localStorage.setItem("tipoPerfil", data.tipo);
        }

        alert("Login realizado com sucesso!");

        
        // Ajuste o nome da propriedade 'data.tipo' conforme o que o seu Backend retorna (ex: data.tipoPerfil, data.role, data.tipo)
        const tipoUsuario = data.tipo || data.tipoPerfil || data.role;

        if (tipoUsuario === "RESPONSAVEL" || tipoUsuario === "responsavel") {
            window.location.href = "perfil-responsavel.html"; // Coloque o caminho correto da página de responsável
        } else if (tipoUsuario === "PROFISSIONAL" || tipoUsuario === "profissional") {
            window.location.href = "perfil-profissional.html"; // Coloque o caminho correto da página de profissional
        } else {
            window.location.href = "../index.html";
        }

    } catch (erro) {

        console.error(erro);
        alert("Erro ao conectar com o servidor.");

    }

});