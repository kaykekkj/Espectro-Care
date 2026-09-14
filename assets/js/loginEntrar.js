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

        localStorage.setItem("token", data.token);
        localStorage.setItem("email", data.email);

        alert("Login realizado com sucesso!");
        window.location.href = "../index.html";

    } catch (erro) {

        console.error(erro);
        alert("Erro ao conectar com o servidor.");

    }

});