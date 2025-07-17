// Funções simuladas dos botões superiores (AGORA COM REBOOT FUNCIONAL)
document.querySelector(".top-actions button:nth-child(1)").onclick = () => alert("Logout efetuado.");
document.querySelector(".top-actions button:nth-child(2)").onclick = () => {
    // NOVO: Limpa todas as configurações salvas no localStorage
    localStorage.clear();
    alert("Reiniciando o roteador e apagando todas as configurações salvas!");
    // Opcional: Você pode querer recarregar a página para ver os campos vazios
    // window.location.reload();
};
document.querySelector(".top-actions button:nth-child(3)").onclick = () => alert("Procurando atualizações...");

// Manipulação do menu lateral (mantido)
const menuItems = document.querySelectorAll(".menu-item");
const pageContent = document.getElementById("page-content");

menuItems.forEach(item => {
    item.addEventListener("click", () => {
        document.querySelector(".menu-item.active")?.classList.remove("active");
        item.classList.add("active");

        const page = item.dataset.page;
        loadPageContent(page);

        // Chamar a configuração dos listeners de força de senha APÓS o carregamento do conteúdo
        if (page === "wireless") {
            setupPasswordStrengthListeners();
        }
    });
});

// A principal função que carrega o conteúdo das páginas
function loadPageContent(page) {
    if (page === "internet") {
        // HTML para Internet Settings
        pageContent.innerHTML = `
            <div class="internet-settings form-section">
                <h2 class="section-title">Internet Settings</h2>

                <div class="form-group">
                    <label for="internet-connection-type">Internet Connection Type:</label>
                    <select id="internet-connection-type" class="styled-input styled-select">
                        <option>PPPoE</option>
                        <option>DHCP</option>
                        <option>Static</option>
                    </select>
                </div>

                <div class="form-group">
                    <label for="internet-username">Username:</label>
                    <input type="text" id="internet-username" class="styled-input" />
                </div>

                <div class="form-group">
                    <label for="internet-password">Password:</label>
                    <div class="password-input-with-icon">
                        <input type="password" id="internet-password" class="styled-input" />
                        <span class="password-toggle-icon">
                            &#128065;&#xFE0E; 
                        </span>
                    </div>
                </div>

                <div class="button-container">
                    <button class="save-button" onclick="validateAndSaveInternetSettings()">Save</button>
                </div>
                <div id="internet-message" class="validation-message"></div>
            </div>
        `;
        // Carregar dados salvos para Internet Settings
        loadInternetSettings();

    } else if (page === "wireless") {
        // HTML para Wireless Settings
        pageContent.innerHTML = `
            <div class="wireless-settings form-section">
                <h2 class="section-title">Wireless Settings</h2>

                <div class="wireless-band-section">
                    <div class="form-group wireless-header">
                        <label>2.4GHz Wireless Network:</label>
                        <div class="toggle-controls">
                            <input type="checkbox" id="enable-24ghz" class="styled-checkbox" checked>
                            <label for="enable-24ghz" class="checkbox-label">Enable</label>
                            <a href="#" class="share-network-link">Share Network</a>
                        </div>
                    </div>

                    <div class="form-group">
                        <label for="ssid-24">Network Name (SSID):</label>
                        <input type="text" id="ssid-24" value="" class="styled-input" />
                        <input type="checkbox" id="hide-ssid-24" class="styled-checkbox">
                        <label for="hide-ssid-24" class="checkbox-label">Hide SSID</label>
                    </div>

                    <div class="form-group">
                        <label for="password-24">Password:</label>
                        <div class="password-group">
                            <input type="password" id="password-24" value="" class="styled-input" />
                            <div class="signal-strength-selector" id="strength-24ghz">
                                <span class="signal-option" data-level="low">Low</span>
                                <span class="signal-option" data-level="middle">Middle</span>
                                <span class="signal-option" data-level="high">High</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="wireless-band-section">
                    <div class="form-group wireless-header">
                        <label>5GHz Wireless Network:</label>
                        <div class="toggle-controls">
                            <input type="checkbox" id="enable-5ghz" class="styled-checkbox" checked>
                            <label for="enable-5ghz" class="checkbox-label">Enable</label>
                            <a href="#" class="share-network-link">Share Network</a>
                        </div>
                    </div>

                    <div class="form-group">
                        <label for="ssid-5">Network Name (SSID):</label>
                        <input type="text" id="ssid-5" value="" class="styled-input" />
                        <input type="checkbox" id="hide-ssid-5" class="styled-checkbox">
                        <label for="hide-ssid-5" class="checkbox-label">Hide SSID</label>
                    </div>

                    <div class="form-group">
                        <label for="password-5">Password:</label>
                        <div class="password-group">
                            <input type="password" id="password-5" value="" class="styled-input" />
                            <div class="signal-strength-selector" id="strength-5ghz">
                                <span class="signal-option" data-level="low">Low</span>
                                <span class="signal-option" data-level="middle">Middle</span>
                                <span class="signal-option" data-level="high">High</span>
                            </div>
                        </div>
                    </div>
                </div>

                <button class="save-button" onclick="validateAndSaveWirelessSettings()">Save</button>
                <div id="wireless-message" class="validation-message"></div>
            </div>
        `;
        // Carregar dados salvos para Wireless Settings
        loadWirelessSettings();

    } else {
        // Código para Network Map (página inicial) - mantido
        pageContent.innerHTML = `
            <div class="status-panel">
                <div class="internet-status">
                    <div class="icon">🌐</div>
                    <div>Internet</div>
                </div>
                <div class="main-ap">
                    <div class="icon">📶</div>
                    <div>Main AP</div>
                    <div>2.4GHz | 5GHz</div>
                </div>
            </div>
            <div class="topology">
                <h3>Topology</h3>
                <table>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Device Name</th>
                            <th>IP Address</th>
                            <th>MAC Address</th>
                            <th>Connection Type</th>
                            <th>Signal Strength</th>
                            <th>Link Rate</th>
                            <th>Operation</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>1</td>
                            <td>ArcherNX200_DCAB</td>
                            <td>192.168.1.1</td>
                            <td>00:FF:00:41:DC:AB</td>
                            <td>--</td>
                            <td>--</td>
                            <td>--</td>
                            <td>--</td>
                        </tr>
                    </tbody>
                </table>
                <button class="btn-mesh">Add Mesh Device</button>
            </div>
        `;
    }
}

// Funções de validação e salvamento (mantido)
function validateAndSaveInternetSettings() {
    const usernameInput = document.getElementById('internet-username');
    const passwordInput = document.getElementById('internet-password');
    const connectionTypeSelect = document.getElementById('internet-connection-type');
    const messageDiv = document.getElementById('internet-message');

    let isValid = true;
    let messages = [];

    if (usernameInput.value.trim() === '') {
        isValid = false;
        messages.push('O campo Username precisa ser preenchido.');
    }
    if (passwordInput.value.trim() === '') {
        isValid = false;
        messages.push('O campo Password precisa ser preenchido.');
    }

    if (!isValid) {
        messageDiv.innerHTML = messages.join('<br>');
        messageDiv.style.color = 'red';
        messageDiv.style.display = 'block';
    } else {
        messageDiv.style.display = 'none';
        alert('Configurações de Internet salvas com sucesso!');

        const internetSettings = {
            username: usernameInput.value,
            password: passwordInput.value,
            connectionType: connectionTypeSelect.value
        };
        localStorage.setItem('internetSettings', JSON.stringify(internetSettings));
    }
}

function validateAndSaveWirelessSettings() {
    const enable24ghz = document.getElementById('enable-24ghz');
    const ssid24 = document.getElementById('ssid-24');
    const password24 = document.getElementById('password-24');

    const enable5ghz = document.getElementById('enable-5ghz');
    const ssid5 = document.getElementById('ssid-5');
    const password5 = document.getElementById('password-5');

    const hideSsid24 = document.getElementById('hide-ssid-24');
    const hideSsid5 = document.getElementById('hide-ssid-5');

    const messageDiv = document.getElementById('wireless-message');

    let isValid = true;
    let messages = [];

    // Validação para 2.4GHz se estiver habilitado
    if (enable24ghz.checked) {
        if (ssid24.value.trim() === '') {
            isValid = false;
            messages.push('O campo "Network Name (SSID)" da rede 2.4GHz precisa ser preenchido.');
        }
        if (password24.value.trim() === '') {
            isValid = false;
            messages.push('O campo "Password" da rede 2.4GHz precisa ser preenchido.');
        }
    }

    // Validação para 5GHz se estiver habilitado
    if (enable5ghz.checked) {
        if (ssid5.value.trim() === '') {
            isValid = false;
            messages.push('O campo "Network Name (SSID)" da rede 5GHz precisa ser preenchido.');
        }
        if (password5.value.trim() === '') {
            isValid = false;
            messages.push('O campo "Password" da rede 5GHz precisa ser preenchido.');
        }
    }

    if (!isValid) {
        messageDiv.innerHTML = messages.join('<br>');
        messageDiv.style.color = 'red';
        messageDiv.style.display = 'block';
    } else {
        messageDiv.style.display = 'none';
        alert('Configurações Wireless salvas com sucesso!');

        const wirelessSettings = {
            '24ghz': {
                enabled: enable24ghz.checked,
                ssid: ssid24.value,
                password: password24.value,
                hideSsid: hideSsid24.checked
            },
            '5ghz': {
                enabled: enable5ghz.checked,
                ssid: ssid5.value,
                password: password5.value,
                hideSsid: hideSsid5.checked
            }
        };
        localStorage.setItem('wirelessSettings', JSON.stringify(wirelessSettings));
    }
}

// Funções para carregar configurações do localStorage (mantido)
function loadInternetSettings() {
    const savedSettings = localStorage.getItem('internetSettings');
    if (savedSettings) {
        const internetSettings = JSON.parse(savedSettings);
        document.getElementById('internet-username').value = internetSettings.username || '';
        document.getElementById('internet-password').value = internetSettings.password || '';
        document.getElementById('internet-connection-type').value = internetSettings.connectionType || 'PPPoE';
    }
}

function loadWirelessSettings() {
    const savedSettings = localStorage.getItem('wirelessSettings');
    if (savedSettings) {
        const wirelessSettings = JSON.parse(savedSettings);

        // 2.4GHz
        const enable24ghz = document.getElementById('enable-24ghz');
        const ssid24 = document.getElementById('ssid-24');
        const password24 = document.getElementById('password-24');
        const hideSsid24 = document.getElementById('hide-ssid-24');

        if (wirelessSettings['24ghz']) {
            enable24ghz.checked = wirelessSettings['24ghz'].enabled;
            ssid24.value = wirelessSettings['24ghz'].ssid || '';
            password24.value = wirelessSettings['24ghz'].password || '';
            hideSsid24.checked = wirelessSettings['24ghz'].hideSsid;
            checkPasswordStrength(password24.value, document.getElementById('strength-24ghz'));
        }

        // 5GHz
        const enable5ghz = document.getElementById('enable-5ghz');
        const ssid5 = document.getElementById('ssid-5');
        const password5 = document.getElementById('password-5');
        const hideSsid5 = document.getElementById('hide-ssid-5');

        if (wirelessSettings['5ghz']) {
            enable5ghz.checked = wirelessSettings['5ghz'].enabled;
            ssid5.value = wirelessSettings['5ghz'].ssid || '';
            password5.value = wirelessSettings['5ghz'].password || '';
            hideSsid5.checked = wirelessSettings['5ghz'].hideSsid;
            checkPasswordStrength(password5.value, document.getElementById('strength-5ghz'));
        }
    }
}

// Função para verificar a força da senha (mantido)
function checkPasswordStrength(password, selectorElement) {
    const strengthOptions = selectorElement.querySelectorAll('.signal-option');
    strengthOptions.forEach(option => option.classList.remove('active'));

    const len = password.length;
    let strengthLevel = 'low';

    const hasLetters = /[a-zA-Z]/.test(password);
    const hasNumbers = /[0-9]/.test(password);
    const hasSymbols = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    if (len >= 8) {
        if (hasLetters && hasNumbers && hasSymbols) {
            strengthLevel = 'high';
        } else if (hasLetters && hasNumbers) {
            strengthLevel = 'middle';
        } else {
            strengthLevel = 'low';
        }
    } else {
        strengthLevel = 'low';
    }

    if (len === 0) {
        return;
    } else if (strengthLevel === 'low') {
        strengthOptions[0].classList.add('active');
    } else if (strengthLevel === 'middle') {
        strengthOptions[1].classList.add('active');
    } else if (strengthLevel === 'high') {
        strengthOptions[2].classList.add('active');
    }
}

// Configura os listeners para os campos de senha (mantido)
function setupPasswordStrengthListeners() {
    const password24 = document.getElementById('password-24');
    const strength24ghzSelector = document.getElementById('strength-24ghz');

    const password5 = document.getElementById('password-5');
    const strength5ghzSelector = document.getElementById('strength-5ghz');

    if (password24 && strength24ghzSelector) {
        password24.addEventListener('input', (event) => {
            checkPasswordStrength(event.target.value, strength24ghzSelector);
        });
        checkPasswordStrength(password24.value, strength24ghzSelector);
    }

    if (password5 && strength5ghzSelector) {
        password5.addEventListener('input', (event) => {
            checkPasswordStrength(event.target.value, strength5ghzSelector);
        });
        checkPasswordStrength(password5.value, strength5ghzSelector);
    }
}

// Script para funcionalidade do toggle de senha e carregamento inicial (mantido)
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('page-content').addEventListener('click', (event) => {
        const passwordToggle = event.target.closest('.password-toggle-icon');
        if (passwordToggle) {
            const passwordInput = passwordToggle.previousElementSibling;
            if (passwordInput && passwordInput.type === 'password') {
                passwordInput.type = 'text';
                passwordToggle.innerHTML = '&#128064;&#xFE0E;';
            } else if (passwordInput && passwordInput.type === 'text') {
                passwordInput.type = 'password';
                passwordToggle.innerHTML = '&#128065;&#xFE0E;';
            }
        }
    });

    loadPageContent("network");

    if (document.getElementById('page-content').querySelector('.wireless-settings')) {
        setupPasswordStrengthListeners();
    }
});

window.addEventListener('load', () => {
    if (document.getElementById('page-content').querySelector('.wireless-settings')) {
        setupPasswordStrengthListeners();
    }
});

