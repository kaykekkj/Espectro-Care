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

        // Salva os dados de autenticação no LocalStorage
        localStorage.setItem("token", data.token);
        localStorage.setItem("email", data.email);
        
        if (data.tipo) {
            localStorage.setItem("tipoPerfil", data.tipo);
        }

        alert("Login realizado com sucesso!");

        // Define a variável a partir do retorno da API (data.tipo)
        const tipoUsuario = data.tipo;

        // Redirecionamento correto dependendo do tipo de perfil
        if (tipoUsuario === "RESPONSAVEL" || tipoUsuario === "responsavel") {
            window.location.href = "userResponsavel.html"; 
        } else if (tipoUsuario === "PROFISSIONAL" || tipoUsuario === "profissional") {
            window.location.href = "userProfissional.html"; // Corrigido o .html aqui
        } else {
            window.location.href = "../index.html";
        }

    } catch (erro) {

        console.error(erro);
        alert("Erro ao conectar com o servidor.");

    }

});