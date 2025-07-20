document.addEventListener('DOMContentLoaded', () => {
    const tvScreen = document.getElementById('tvScreen');
    const tvMessage = document.getElementById('tvMessage');
    const powerButton = document.getElementById('powerButton');
    const configButton = document.getElementById('configButton');
    const configModal = document.getElementById('configModal');
    const closeModalButton = document.getElementById('closeModalButton');
    const saveConfigButton = document.getElementById('saveConfigButton');
    const wifiNameInput = document.getElementById('wifiName');
    const wifiPasswordInput = document.getElementById('wifiPassword');
    const ipAddressInput = document.getElementById('ipAddress');

    let isTvOn = false; // Estado inicial da TV
    let hasInternetSignal = false; // Novo estado para sinal de internet

    // Função para ligar/desligar a TV
    function togglePower() {
        isTvOn = !isTvOn; // Inverte o estado

        if (isTvOn) {
            tvScreen.classList.add('on');
            // Verifica se já tem sinal de internet ao ligar
            if (hasInternetSignal) {
                tvMessage.innerHTML = 'TV Ligada - Sinal com Internet <span class="wifi-icon">📶</span>';
            } else {
                tvMessage.textContent = 'TV Ligada - Sem Sinal';
            }
            powerButton.textContent = 'Desligar';
            alert('A TV foi ligada.');
        } else {
            tvScreen.classList.remove('on');
            tvMessage.textContent = 'TV Desligada';
            powerButton.textContent = 'Ligar';
            alert('A TV foi desligada.');
            configModal.style.display = 'none'; // Fecha a modal se a TV for desligada
            hasInternetSignal = false; // Reseta o sinal de internet ao desligar
        }
    }

    // Função para abrir a modal de configurações// Função para abrir a modal de configurações
function openConfig() {
    if (!isTvOn) {
        alert('Ligue a TV primeiro para acessar as configurações!');
        return;
    }
    configModal.style.display = 'flex'; // Exibe a modal
}

// Função para fechar a modal de configurações
function closeConfig() {
    configModal.style.display = 'none'; // Esconde a modal
}

    // Função para fechar a modal de configurações
    function closeConfig() {
        configModal.style.display = 'none'; // Esconde a modal
    }

    // Função para salvar as configurações (simulado)
    function saveConfig() {
        const wifi = wifiNameInput.value;
        const password = wifiPasswordInput.value;
        const ip = ipAddressInput.value;

        // Validar se os campos estão preenchidos para simular a conexão
        if (wifi && password && ip) {
            hasInternetSignal = true; // Define que há sinal de internet
            if (isTvOn) { // Atualiza a tela da TV se ela estiver ligada
                tvMessage.innerHTML = 'TV Ligada - Sinal com Internet <span class="wifi-icon">📶</span>';
            }
            alert(`Configurações salvas (simulado):\nWi-Fi: ${wifi}\nSenha: ${password}\nIP: ${ip}\n\nConexão estabelecida!`);
        } else {
            hasInternetSignal = false; // Sem sinal se os campos não estiverem preenchidos
            if (isTvOn) {
                tvMessage.textContent = 'TV Ligada - Sem Sinal';
            }
            alert('Por favor, preencha todos os campos para simular a conexão.');
        }

        closeConfig(); // Fecha a modal após salvar
    }

    // Event Listeners
    powerButton.addEventListener('click', togglePower);
    configButton.addEventListener('click', openConfig);
    closeModalButton.addEventListener('click', closeConfig);
    saveConfigButton.addEventListener('click', saveConfig);

    // Fechar a modal clicando fora dela
    window.addEventListener('click', (event) => {
        if (event.target == configModal) {
            closeConfig();
        }
    });
});
