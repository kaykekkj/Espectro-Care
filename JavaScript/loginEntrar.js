document.querySelector(".botao-logar").addEventListener("click", async () => {

    const email = document.querySelector(".email").value;
    const senha = document.querySelector(".senha").value;

    try {

        const response = await fetch(
            "http://localhost:8080/auth/login",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    email: email,
                    senha: senha
                })
            }
        ).then(response => response.json())
            .then(data => console.log(data))
            it.catch(error => console.error(error));

        const data = await response.json();

        if (response.ok) {

            localStorage.setItem("token", data.token);
            localStorage.setItem("email", data.email);

            alert("Login realizado com sucesso!");

            window.location.href = "index.html";

        } else {

            alert("Email ou senha inválidos.");

        }

    } catch (erro) {

        console.error(erro);
        alert("Erro ao conectar com o servidor.");

    }

});