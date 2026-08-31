const API_URL = 'https://neurohelp-backend.onrender.com/api/perfil';

// Executa ao carregar o DOM
document.addEventListener('DOMContentLoaded', () => {
    carregarPerfil();
});

// Busca os Dados do Perfil (GET)
async function carregarPerfil() {
    const token = localStorage.getItem('token_jwt');

    if (!token) {
        exibirMensagem('Nenhum token encontrado! Faça login primeiro.', true);
        return;
    }

    try {
        const response = await fetch(API_URL, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.status === 401 || response.status === 403) {
            exibirMensagem('Sessão expirada ou não autorizada.', true);
            return;
        }

        if (!response.ok) {
            throw new Error('Erro ao carregar dados do perfil.');
        }

        const dados = await response.json();

        // Preenche os campos do formulário
        document.getElementById('nome').value = dados.nome || '';
        document.getElementById('email').value = dados.email || '';
        document.getElementById('bio').value = dados.bio || '';
        document.getElementById('telefone').value = dados.telefone || '';
        document.getElementById('estado').value = dados.estado || '';
        document.getElementById('numRegistro').value = dados.numRegistro || '';

    } catch (error) {
        exibirMensagem(error.message, true);
    }
}

// Atualiza os Dados do Perfil (PUT)
document.getElementById('formPerfil').addEventListener('submit', async (e) => {
    e.preventDefault();

    const token = localStorage.getItem('token_jwt');

    const dadosAtualizados = {
        nome: document.getElementById('nome').value,
        bio: document.getElementById('bio').value,
        telefone: document.getElementById('telefone').value,
        estado: document.getElementById('estado').value,
        numRegistro: document.getElementById('numRegistro').value
    };

    try {
        const response = await fetch(API_URL, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(dadosAtualizados)
        });

        if (!response.ok) {
            throw new Error('Erro ao atualizar perfil.');
        }

        exibirMensagem('Perfil atualizado com sucesso!', false);

    } catch (error) {
        exibirMensagem(error.message, true);
    }
});

// Exibe mensagens de feedback na tela
function exibirMensagem(texto, isErro) {
    const msgDiv = document.getElementById('msg');
    msgDiv.textContent = texto;
    msgDiv.className = `mensagem ${isErro ? 'erro' : 'sucesso'}`;
    msgDiv.style.display = 'block';
}