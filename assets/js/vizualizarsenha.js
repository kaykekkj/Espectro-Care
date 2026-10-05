let aberto = document.querySelector('#aberto')
let fechado = document.querySelector('#fechado')
let inputsenha = document.querySelector('#senha')

aberto.addEventListener('click', mostrarSenha)
fechado.addEventListener('click', mostrarSenha)

function mostrarSenha() {
    if (inputsenha.type === 'password') {
        inputsenha.type = 'text'
        aberto.style.display = 'block'
        fechado.style.display = 'none'
    } else {
        inputsenha.type = 'password'
        aberto.style.display = 'none'
        fechado.style.display = 'block'
    }
}

const senhaProf = document.querySelector('#senhaProf');
const olhoSenha = document.querySelector('#olhoSenha');

const confirmarSenhaProf = document.querySelector('#confirmarSenhaProf');
const olhoConfirmarSenha = document.querySelector('#olhoConfirmarSenha');


olhoSenha.addEventListener('click', () => {
    if (senhaProf.type === 'password') {
        senhaProf.type = 'text';

        olhoSenha.classList.remove('fa-eye');
        olhoSenha.classList.add('fa-eye-slash');
    } else {
        senhaProf.type = 'password';

        olhoSenha.classList.remove('fa-eye-slash');
        olhoSenha.classList.add('fa-eye');
    }
});


olhoConfirmarSenha.addEventListener('click', () => {
    if (confirmarSenhaProf.type === 'password') {
        confirmarSenhaProf.type = 'text';

        olhoConfirmarSenha.classList.remove('fa-eye');
        olhoConfirmarSenha.classList.add('fa-eye-slash');
    } else {
        confirmarSenhaProf.type = 'password';

        olhoConfirmarSenha.classList.remove('fa-eye-slash');
        olhoConfirmarSenha.classList.add('fa-eye');
    }
});
