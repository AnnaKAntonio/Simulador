document.addEventListener('DOMContentLoaded', () => {
    // Referências aos elementos do DOM para o computador
    const computerScreen = document.getElementById('computerScreen');
    const computerMessage = document.getElementById('computerMessage');
    const powerButton = document.getElementById('powerButton');
    const configButton = document.getElementById('configButton');
    const configModal = document.getElementById('configModal');
    const closeModalButton = document.getElementById('closeModalButton');
    const saveConfigButton = document.getElementById('saveConfigButton');
    const wifiNameInput = document.getElementById('wifiName');
    const wifiPasswordInput = document.getElementById('wifiPassword');
    const ipAddressInput = document.getElementById('ipAddress');

    let isComputerOn = false; // Estado inicial do computador
    let hasInternetSignal = false; // Estado para sinal de internet

    // Função para ligar/desligar o computador
    function togglePower() {
        isComputerOn = !isComputerOn; // Inverte o estado

        if (isComputerOn) {
            computerScreen.classList.add('on');
            computerMessage.textContent = 'Inicializando sistema...';

            setTimeout(() => {
                if (hasInternetSignal) {
                    computerMessage.innerHTML = 'Conectado à Internet <span class="wifi-icon">📶</span>';
                } else {
                    computerMessage.textContent = 'Sem conexão com a rede. Verifique a rede Wi-Fi.';
                }
            }, 1500); // Mostra a mensagem após 1.5 segundos

            powerButton.textContent = 'Desligar';
            alert('O computador foi ligado.');
        } else {
            computerScreen.classList.remove('on');
            computerMessage.textContent = 'Computador Desligado';
            powerButton.textContent = 'Ligar';
            alert('O computador foi desligado.');
            configModal.style.display = 'none'; // Fecha a modal se o computador for desligado
            hasInternetSignal = false; // Reseta o sinal de internet ao desligar
        }
    }

    // Função para abrir a modal de configurações
    function openConfig() {
        if (!isComputerOn) {
            alert('Ligue o computador primeiro para acessar as configurações de rede!');
            return;
        }
        configModal.style.display = 'flex'; // Exibe a modal
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
            if (isComputerOn) { // Atualiza a tela do computador se ele estiver ligado
                computerMessage.innerHTML = 'Conectado à Internet <span class="wifi-icon">📶</span>';
            }
            alert(`Configurações de Rede salvas (simulado):\nWi-Fi: ${wifi}\nSenha: ${password}\nIP: ${ip}\n\nConexão de rede estabelecida com sucesso!`);
        } else {
            hasInternetSignal = false; // Sem sinal se os campos não estiverem preenchidos
            if (isComputerOn) {
                computerMessage.textContent = 'Verificando conexão... Sem internet.';
            }
            alert('Por favor, preencha todos os campos para simular a conexão de rede.');
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
