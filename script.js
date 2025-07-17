// === VARIÁVEIS GLOBAIS ===
let connections = [];
let equipmentCounter = 0; // Para roteadores e ONUs
let deviceCounter = 0; // Novo contador para TV e Notebook

let draggedElement = null; // Elemento sendo arrastado (da sidebar para workspace)

let drawingCable = false;
let startPort = null;
let tempCableLine = null;


const sidebarItems = document.querySelectorAll('.product-item');
const workspace = document.getElementById('workspace');
const trashCan = document.getElementById('trash-can');

// --- LÓGICA DAS LUZES ---
function getLuzElement(equipmentId, luzIdSuffix) {
    const equipment = document.getElementById(equipmentId);
    if (!equipment) return null;
    return equipment.querySelector(`span#${equipmentId}-${luzIdSuffix}`);
}

function hasActivePowerConnection(equipmentId) {
    return connections.some(conn => {
        const port1 = document.getElementById(conn.startPortId);
        const port2 = document.getElementById(conn.endPortId);
        
        // Verifica se o cabo é uma conexão de energia
        const isPowerCable = (port1?.dataset.portType === 'power-out' && port2?.dataset.portType === 'power-in') ||
                             (port1?.dataset.portType === 'power-in' && port2?.dataset.portType === 'power-out');

        if (!isPowerCable) return false;

        // Verifica se uma das portas do cabo pertence ao equipamento e a outra à tomada
        const parentEq1 = port1?.closest('.dragged-equipment');
        const parentEq2 = port2?.closest('.dragged-equipment');

        return (parentEq1?.id === equipmentId && port2?.id === 'power-outlet-port') ||
               (parentEq2?.id === equipmentId && port1?.id === 'power-outlet-port');
    });
}


function toggleEquipmentPower(equipmentId, equipmentType, forceState = null) {
    console.log(`Chamou toggleEquipmentPower para ${equipmentId}, tipo: ${equipmentType}, forceState: ${forceState}`);
    let pwrLightIdSuffix;
    if (equipmentType.includes('roteador')) {
        pwrLightIdSuffix = 'pwrR';
    } else if (equipmentType === 'onu') {
        pwrLightIdSuffix = 'pwrO';
    } else if (equipmentType === 'tv' || equipmentType === 'notebook') {
        pwrLightIdSuffix = 'pwrD'; // Luz de energia para dispositivos
    } else {
        return; // Tipo desconhecido
    }
    
    const pwrLight = getLuzElement(equipmentId, pwrLightIdSuffix);
    if (!pwrLight) {
        console.warn(`Luz PWR não encontrada para ${equipmentId}`);
        return;
    }

    const hasCableConnected = hasActivePowerConnection(equipmentId);

    let newState;
    if (forceState !== null) { // Forçado por conexão/desconexão de cabo
        newState = forceState;
        // Se o cabo está conectado e se tentou desligar via botão, não desliga pelo botão
        if (hasCableConnected && !newState && forceState === false) {
             console.log(`Impedindo desligamento de ${equipmentId} pelo botão PWR, cabo de energia conectado.`);
             return; 
        }
    } else { // Clicado no botão
        if (hasCableConnected) {
             // Se tem cabo, o botão PWR só pode "desligar" (na verdade, remove o cabo)
             console.log(`Botão PWR de ${equipmentId} clicado com cabo. Desconectando o cabo de energia.`);
             const powerConnection = connections.find(conn => {
                const port1 = document.getElementById(conn.startPortId);
                const port2 = document.getElementById(conn.endPortId);
                const isPowerCable = (port1?.dataset.portType === 'power-out' && port2?.dataset.portType === 'power-in') ||
                                     (port1?.dataset.portType === 'power-in' && port2?.dataset.portType === 'power-out');
                
                const parentEq1 = port1?.closest('.dragged-equipment');
                const parentEq2 = port2?.closest('.dragged-equipment');

                return isPowerCable && ((parentEq1?.id === equipmentId && port2?.id === 'power-outlet-port') ||
                                        (parentEq2?.id === equipmentId && port1?.id === 'power-outlet-port'));
             });
             if (powerConnection) {
                 removeCable(powerConnection.id);
             }
             return; // Sai da função após lidar com o botão em presença de cabo
        } else {
            newState = !pwrLight.classList.contains("verde"); // Comuta o estado se não há cabo
        }
    }

    console.log(`Novo estado de energia de ${equipmentId}: ${newState ? 'Ligado' : 'Desligado'}`);

    const lightsToManage = [];
    if (equipmentType.includes('roteador')) {
        lightsToManage.push(getLuzElement(equipmentId, "wanR"));
        lightsToManage.push(getLuzElement(equipmentId, "lanR")); // Luz única para as 4 LANs
        lightsToManage.push(getLuzElement(equipmentId, "wifiR"));
    } else if (equipmentType === 'onu') {
        lightsToManage.push(getLuzElement(equipmentId, "lanO"));
        lightsToManage.push(getLuzElement(equipmentId, "ponO"));
        lightsToManage.push(getLuzElement(equipmentId, "losO"));
    } else if (equipmentType === 'tv' || equipmentType === 'notebook') {
        lightsToManage.push(getLuzElement(equipmentId, "lanD")); // Luz LAN para dispositivos
    }

    if (newState) {
        pwrLight.className = "luz verde";
        console.log(`Ligando ${equipmentId}. Luz PWR verde.`);
        // Luzes de dados só acendem se houver conexão de dados ativa E se o equipamento estiver ligado
        connections.forEach(conn => updateConnectedPortLights(conn.startPortId, conn.endPortId, true));

    } else {
        pwrLight.className = "luz apagada";
        console.log(`Desligando ${equipmentId}. Apagando luzes associadas.`);
        lightsToManage.forEach(light => {
            if (light) {
                light.className = "luz apagada";
                light.classList.remove("piscar-verde", "piscar-vermelho");
            }
        });
        // Desliga também as luzes das portas dos cabos de dados conectados a este equipamento
        connections.forEach(conn => {
            const port1 = document.getElementById(conn.startPortId);
            const port2 = document.getElementById(conn.endPortId);
            const eq1 = port1?.closest('.dragged-equipment');
            const eq2 = port2?.closest('.dragged-equipment');
            if (!eq1 || !eq2) return;

            const isDataCable = !((port1.dataset.portType === 'power-out' && port2.dataset.portType === 'power-in') ||
                                  (port1.dataset.portType === 'power-in' && port2.dataset.portType === 'power-out'));

            if (isDataCable && (eq1.id === equipmentId || eq2.id === equipmentId)) {
                // Força o estado 'apagado' para as luzes visuais das portas
                port1.style.backgroundColor = port1.dataset.defaultColor;
                port1.style.borderColor = '#a0a0a0';
                port2.style.backgroundColor = port2.dataset.defaultColor;
                port2.style.borderColor = '#a0a0a0';
                // E também apaga as luzes de status WAN/LAN/PON/LOS/LAN-D
                updateConnectedPortLights(conn.startPortId, conn.endPortId, false);
            }
        });
    }

    // Atualiza luzes de portas conectadas após mudança de estado do equipamento
    connections.forEach(conn => {
        const port1 = document.getElementById(conn.startPortId);
        const port2 = document.getElementById(conn.endPortId);
        
        // Verifica se alguma das portas está dentro do equipamento que mudou de estado
        const port1ParentEqId = port1?.closest('.dragged-equipment')?.id;
        const port2ParentEqId = port2?.closest('.dragged-equipment')?.id;

        if (port1ParentEqId === equipmentId || port2ParentEqId === equipmentId) {
             updateConnectedPortLights(conn.startPortId, conn.endPortId, true); // Força atualização para refletir o novo estado do equipamento
        }
    });
}

// Funções de toggle específicas por tipo de equipamento
function toggleLanRoteador(equipmentId) {
    const pwrR = getLuzElement(equipmentId, "pwrR");
    if (!pwrR || pwrR.classList.contains("apagada")) { return; }
    const lan = getLuzElement(equipmentId, "lanR");
    if (!lan) { return; }
    if (lan.classList.contains("verde")) { lan.className = "luz vermelha"; }
    else if (lan.classList.contains("vermelha")) { lan.className = "luz apagada"; }
    else { lan.className = "luz verde"; }
}

function toggleWifiRoteador(equipmentId) {
    const pwrR = getLuzElement(equipmentId, "pwrR");
    if (!pwrR || pwrR.classList.contains("apagada")) { return; }
    const wifi = getLuzElement(equipmentId, "wifiR");
    if (!wifi) { return; }
    wifi.className = wifi.classList.contains("apagada") ? "luz verde" : "luz apagada";
}

function toggleFibra(equipmentId) {
    const pwrO = getLuzElement(equipmentId, "pwrO");
    if (!pwrO || pwrO.classList.contains("apagada")) { return; }
    const los = getLuzElement(equipmentId, "losO");
    const pon = getLuzElement(equipmentId, "ponO");
    if (!los) { return; }

    if (los.classList.contains("piscar-vermelho")) {
        los.className = "luz apagada";
        if (pon) {
            pon.className = "luz verde piscar-verde";
        }
    } else {
        los.className = "luz piscar-vermelho";
        if (pon) {
            pon.className = "luz apagada";
            pon.classList.remove("piscar-verde");
        }
    }
}

function toggleLanOnu(equipmentId) {
    const pwrO = getLuzElement(equipmentId, "pwrO");
    if (!pwrO || pwrO.classList.contains("apagada")) { return; }
    const lan = getLuzElement(equipmentId, "lanO");
    if (!lan) { return; }
    lan.className = lan.classList.contains("apagada") ? "luz verde" : "luz apagada";
}

function togglePon(equipmentId) {
    const pwrO = getLuzElement(equipmentId, "pwrO");
    if (!pwrO || pwrO.classList.contains("apagada")) { return; }
    const los = getLuzElement(equipmentId, "losO");
    const pon = getLuzElement(equipmentId, "ponO");

    if (!pon) { return; }
    if (los && los.classList.contains("piscar-vermelho")) { return; }

    if (pon.classList.contains("piscar-verde")) {
        pon.classList.remove("piscar-verde");
        pon.className = "luz verde";
    } else if (pon.classList.contains("verde")) {
        pon.className = "luz apagada";
    } else {
        pon.className = "luz verde piscar-verde";
    }
}

// Funções para TV/Notebook
function toggleLanDevice(deviceId) {
    const pwrD = getLuzElement(deviceId, "pwrD");
    if (!pwrD || pwrD.classList.contains("apagada")) { return; }
    const lan = getLuzElement(deviceId, "lanD");
    if (!lan) { return; }
    lan.className = lan.classList.contains("apagada") ? "luz verde" : "luz apagada";
}


// --- LÓGICA DE DRAG-AND-DROP DA SIDEBAR PARA WORKSPACE ---
sidebarItems.forEach(item => {
    item.addEventListener('dragstart', (e) => {
        draggedElement = e.target;
        e.dataTransfer.setData('text/plain', draggedElement.dataset.type);
        setTimeout(() => e.target.style.opacity = '0', 0);
    });

    item.addEventListener('dragend', (e) => {
        e.target.style.opacity = '1';
        draggedElement = null;
        trashCan.classList.remove('highlight');
        // A classe 'drag-over-trash' é do elemento sendo arrastado, não do workspace
    });
});

workspace.addEventListener('dragover', (e) => {
    e.preventDefault();
    if (draggedElement) {
        // Não adicione classe ao workspace, apenas à lixeira se o elemento estiver sobre ela
    }
});

workspace.addEventListener('dragleave', (e) => {
    // Não é necessário remover classe aqui, a lixeira trata isso
});

workspace.addEventListener('drop', (e) => {
    e.preventDefault();
    // A classe 'drag-over-trash' é removida no onMouseUp do elemento arrastado

    const dataType = e.dataTransfer.getData('text/plain');

    if (e.target.closest('#trash-can')) {
        return; // Soltou na lixeira, será tratado pelo evento de drop da lixeira
    }

    // Adiciona equipamentos e dispositivos
    if (dataType === 'roteador' || dataType === 'roteador-secundario' || dataType === 'onu' || dataType === 'tv' || dataType === 'notebook') {
        addElementToWorkspace(e.clientX, e.clientY, dataType);
    }

    const initialInstruction = workspace.querySelector('h2');
    if (initialInstruction && initialInstruction.style.display !== 'none') {
        initialInstruction.style.display = 'none';
    }
    draggedElement = null; // Resetar após soltar no workspace
});

// ---  ADICIONAR ELEMENTOS AO WORKSPACE ---
function addElementToWorkspace(x, y, type) {
    let newId;
    let name;
    let iconHtml;
    let lightsHtml = '';
    let buttonsHtml = '';
    let portsHtml = '';
    let classes = ['dragged-equipment'];

    if (type.includes('roteador') || type === 'onu') {
        equipmentCounter++;
        newId = `${type}-${equipmentCounter}`;
        classes.push(type); // Adiciona a classe do tipo (ex: 'roteador', 'onu')

        if (type === 'roteador') {
            iconHtml = '<img src="https://img.icons8.com/ios-filled/50/wifi-router.png" alt="Roteador">';
            name = "Roteador Principal";
            lightsHtml = `
                <div class="linha">
                    <div class="luz-container">PWR: <span id="${newId}-pwrR" class="luz apagada"></span></div>
                    <div class="luz-container">WAN: <span id="${newId}-wanR" class="luz apagada"></span></div>
                </div>
                <div class="linha">
                    <div class="luz-container">LAN: <span id="${newId}-lanR" class="luz apagada"></span></div>
                    <div class="luz-container">Wi-Fi: <span id="${newId}-wifiR" class="luz apagada"></span></div>
                </div>
            `;
            buttonsHtml = `
                <button onclick="toggleEquipmentPower('${newId}', 'roteador')">PWR</button>
                <button onclick="toggleLanRoteador('${newId}')">LAN</button>
                <button onclick="toggleWifiRoteador('${newId}')">Wi-Fi</button>
            `;
            portsHtml = `
                <div class="ports-section">
                    <h4>Portas</h4>
                    <div class="port-container"><div class="port power-port" id="${newId}-pwr-port" data-port-type="power-out" data-default-color="#8c8c8c"></div><span>PWR</span></div>
                    <div class="port-container"><div class="port wan-port" id="${newId}-wan-port" data-port-type="wan" data-default-color="#ffb300"></div><span>WAN</span></div>
                    <div class="port-container"><div class="port lan-port" id="${newId}-lan1-port" data-port-type="lan-out" data-default-color="#d3d3d3"></div><span>LAN1</span></div>
                    <div class="port-container"><div class="port lan-port" id="${newId}-lan2-port" data-port-type="lan-out" data-default-color="#d3d3d3"></div><span>LAN2</span></div>
                    <div class="port-container"><div class="port lan-port" id="${newId}-lan3-port" data-port-type="lan-out" data-default-color="#d3d3d3"></div><span>LAN3</span></div>
                    <div class="port-container"><div class="port lan-port" id="${newId}-lan4-port" data-port-type="lan-out" data-default-color="#d3d3d3"></div><span>LAN4</span></div>
   
                </div>
            `;
        } else if (type === 'roteador-secundario') {
            iconHtml = '<img src="https://img.icons8.com/ios-filled/50/wifi-router.png" alt="Roteador Secundário">';
            name = "Roteador (Secundário)";
            lightsHtml = `
                <div class="linha">
                    <div class="luz-container">PWR: <span id="${newId}-pwrR" class="luz apagada"></span></div>
                    <div class="luz-container">LAN: <span id="${newId}-lanR" class="luz apagada"></span></div>
                </div>
                <div class="linha">
                    <div class="luz-container">Wi-Fi: <span id="${newId}-wifiR" class="luz apagada"></span></div>
                </div>
            `;
            buttonsHtml = `
                <button onclick="toggleEquipmentPower('${newId}', 'roteador-secundario')">PWR</button>
                <button onclick="toggleLanRoteador('${newId}')">LAN</button>
                <button onclick="toggleWifiRoteador('${newId}')">Wi-Fi</button>
            `;
            portsHtml = `
                <div class="ports-section">
                    <h4>Portas</h4>
                    <div class="port-container"><div class="port power-port" id="${newId}-pwr-port" data-port-type="power-out" data-default-color="#8c8c8c"></div><span>PWR</span></div>
                    <div class="port-container"><div class="port lan-port" id="${newId}-lan1-port" data-port-type="lan-out" data-default-color="#d3d3d3"></div><span>LAN1</span></div>
                    <div class="port-container"><div class="port lan-port" id="${newId}-lan2-port" data-port-type="lan-out" data-default-color="#d3d3d3"></div><span>LAN2</span></div>
                </div>
            `;
        } else if (type === 'onu') {
            iconHtml = '<img src="https://img.icons8.com/ios-filled/50/ethernet-on.png" alt="ONU">';
            name = "ONU";
            lightsHtml = `
                <div class="linha">
                    <div class="luz-container">PWR: <span id="${newId}-pwrO" class="luz apagada"></span></div>
                    <div class="luz-container">LOS: <span id="${newId}-losO" class="luz apagada"></span></div>
                </div>
                <div class="linha">
                    <div class="luz-container">LAN: <span id="${newId}-lanO" class="luz apagada"></span></div>
                    <div class="luz-container">PON: <span id="${newId}-ponO" class="luz apagada"></span></div>
                </div>
            `;
            buttonsHtml = `
                <button onclick="toggleEquipmentPower('${newId}', 'onu')">PWR</button>
                <button onclick="toggleFibra('${newId}')">Fibra</button>
                <button onclick="toggleLanOnu('${newId}')">LAN</button>
                <button onclick="togglePon('${newId}')">PON</button>
            `;
            portsHtml = `
                <div class="ports-section">
                    <h4>Portas</h4>
                    <div class="port-container"><div class="port power-port" id="${newId}-pwr-port" data-port-type="power-out" data-default-color="#8c8c8c"></div><span>PWR</span></div>
                    <div class="port-container"><div class="port pon-port" id="${newId}-pon-port" data-port-type="pon" data-default-color="#00bcd4"></div><span>PON</span></div>
                    <div class="port-container"><div class="port lan-port" id="${newId}-lan-port" data-port-type="lan-out" data-default-color="#d3d3d3"></div><span>LAN</span></div>

                </div>
            `;
        }
    } else if (type === 'tv' || type === 'notebook') {
        deviceCounter++;
        newId = `${type}-${deviceCounter}`;
        classes.push(type); // Adiciona a classe do tipo (ex: 'tv', 'notebook')

        if (type === 'tv') {
            iconHtml = '<img src="https://img.icons8.com/ios-filled/50/tv.png" alt="TV">';
            name = " TV";
        } else { // notebook
            iconHtml = '<img src="https://img.icons8.com/ios-filled/50/laptop.png" alt="Notebook">';
            name = "PC";
        }
        
        // Dispositivos terão uma luz PWR e uma luz LAN
        lightsHtml = `
            <div class="linha">
                <div class="luz-container">PWR: <span id="${newId}-pwrD" class="luz apagada"></span></div>
            </div>
            <div class="linha">
                <div class="luz-container">LAN: <span id="${newId}-lanD" class="luz apagada"></span></div>
            </div>
        `;
        buttonsHtml = `
            <button onclick="toggleEquipmentPower('${newId}', '${type}')">PWR</button>
            <button onclick="toggleLanDevice('${newId}')">LAN</button>
        `;
        portsHtml = `
            <div class="ports-section">
                <h4>Portas</h4>
                  <div class="port-container"><div class="port power-port" id="${newId}-pwr-port" data-port-type="power-out" data-default-color="#8c8c8c"></div><span>PWR</span></div>
                <div class="port-container"><div class="port lan-port" id="${newId}-lan-port" data-port-type="lan-in" data-default-color="#d3d3d3"></div><span>LAN</span></div>
            </div>
        `;
    }

    const elementHTML = `
        <div class="${classes.join(' ')}" id="${newId}" data-equipment-type="${type}">
            ${iconHtml}
            <span class="equipment-name">${name}</span>
            <div class="status-lights">${lightsHtml}</div>
            <div class="control-buttons">${buttonsHtml}</div>
            ${portsHtml}
        </div>
    `;
    workspace.insertAdjacentHTML('beforeend', elementHTML);
    const newElement = document.getElementById(newId);
    positionNewElement(newElement, x, y);
    makeDraggable(newElement);
}

// --- FUNÇÕES GENÉRICAS PARA DRAG-AND-DROP E POSICIONAMENTO ---
function positionNewElement(element, clientX, clientY) {
    const workspaceRect = workspace.getBoundingClientRect();
    const elementRect = element.getBoundingClientRect();

    const left = clientX - workspaceRect.left - (elementRect.width / 2);
    const top = clientY - workspaceRect.top - (elementRect.height / 2);

    element.style.left = `${left}px`;
    element.style.top = `${top}px`;
}

function makeDraggable(element) {
    let isDragging = false;
    let offsetX, offsetY;

    function onMouseMove(e) {
        if (!isDragging) return;
        e.preventDefault();

        const workspaceRect = workspace.getBoundingClientRect();

        let newLeft = e.clientX - workspaceRect.left - offsetX;
        let newTop = e.clientY - workspaceRect.top - offsetY;

        newLeft = Math.max(0, Math.min(newLeft, workspaceRect.width - element.offsetWidth));
        newTop = Math.max(0, Math.min(newTop, workspaceRect.height - element.offsetHeight));

        element.style.left = `${newLeft}px`;
        element.style.top = `${newTop}px`;

        // Atualizar posição dos cabos conectados
        connections.forEach(conn => {
            const cable = document.getElementById(conn.id);
            if (!cable) return;

            const startPortElement = document.getElementById(conn.startPortId);
            const endPortElement = document.getElementById(conn.endPortId);

            // Verifica se o elemento arrastado contém uma das portas conectadas
            const elementContainsStartPort = startPortElement ? element.contains(startPortElement) : false;
            const elementContainsEndPort = endPortElement ? element.contains(endPortElement) : false;

            if (elementContainsStartPort || elementContainsEndPort) {
                const p1Center = getPortCenter(startPortElement);
                const p2Center = getPortCenter(endPortElement);
                
                cable.setAttribute("x1", p1Center.x);
                cable.setAttribute("y1", p1Center.y);
                cable.setAttribute("x2", p2Center.x);
                cable.setAttribute("y2", p2Center.y);
            }
        });

        // Lógica da lixeira
        const trashRect = trashCan.getBoundingClientRect();
        const elementRect = element.getBoundingClientRect(); // Pega a posição atual do elemento arrastado

        // Verifica se o elemento está sobrepondo a lixeira
        if (elementRect.right > trashRect.left && elementRect.left < trashRect.right &&
            elementRect.bottom > trashRect.top && elementRect.top < trashRect.bottom) {
            trashCan.classList.add('highlight');
            element.classList.add('drag-over-trash'); 
        } else {
            trashCan.classList.remove('highlight');
            element.classList.remove('drag-over-trash');
        }
    }

    function onMouseUp(e) {
        if (isDragging) {
            isDragging = false;
            element.style.cursor = 'grab';
            workspace.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);

            const trashRect = trashCan.getBoundingClientRect();
            const elementRect = element.getBoundingClientRect();

            // Verifica se o elemento foi solto dentro da lixeira
            if (elementRect.right > trashRect.left && elementRect.left < trashRect.right &&
                elementRect.bottom > trashRect.top && elementRect.top < trashRect.bottom) {
                
                removeElement(element.id);
            }
            trashCan.classList.remove('highlight');
            element.classList.remove('drag-over-trash');
        }
    }

    element.addEventListener('mousedown', (e) => {
        // Não iniciar arrasto se clicou em um botão ou uma porta (a porta deve iniciar cabo)
        if (e.target.tagName === 'BUTTON' || e.target.classList.contains('port')) {
            return;
        }

        isDragging = true;
        draggedElement = element;
        offsetX = e.clientX - element.getBoundingClientRect().left;
        offsetY = e.clientY - element.getBoundingClientRect().top;
        element.style.cursor = 'grabbing';
        workspace.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    });
}


// --- LÓGICA DE CONEXÃO DE CABOS ---
function setupSvgCanvas() {
    if (!document.getElementById('svg-canvas')) {
        const svgCanvas = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svgCanvas.setAttribute("id", "svg-canvas");
        svgCanvas.style.position = "absolute";
        svgCanvas.style.top = "0";
        svgCanvas.style.left = "0";
        svgCanvas.style.width = "100%";
        svgCanvas.style.height = "100%";
        svgCanvas.style.pointerEvents = "none"; // Permite cliques "através" do SVG
        workspace.appendChild(svgCanvas);
    }
}
setupSvgCanvas();

// Event listener para iniciar o desenho do cabo
workspace.addEventListener('mousedown', (e) => {
    // Apenas se o clique for diretamente em uma div com a classe 'port'
    if (e.target.classList.contains('port')) {
        drawingCable = true;
        startPort = e.target; // O startPort é a própria div .port clicada
        
        e.preventDefault(); // Impede o comportamento padrão de arrastar para o elemento pai

        const svg = document.getElementById('svg-canvas');
        tempCableLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
        tempCableLine.setAttribute("stroke", "#4CAF50");
        tempCableLine.setAttribute("stroke-width", "3");
        tempCableLine.setAttribute("stroke-linecap", "round");
        tempCableLine.setAttribute("id", "temp-cable");
        tempCableLine.style.pointerEvents = "none"; // Não interage com mouse

        const startPortCenter = getPortCenter(startPort);
        tempCableLine.setAttribute("x1", startPortCenter.x);
        tempCableLine.setAttribute("y1", startPortCenter.y);
        tempCableLine.setAttribute("x2", startPortCenter.x);
        tempCableLine.setAttribute("y2", startPortCenter.y);

        svg.appendChild(tempCableLine);
    }
});

// Event listener para desenhar o cabo temporário
workspace.addEventListener('mousemove', (e) => {
    if (drawingCable && tempCableLine) {
        const workspaceRect = workspace.getBoundingClientRect();
        tempCableLine.setAttribute("x2", e.clientX - workspaceRect.left);
        tempCableLine.setAttribute("y2", e.clientY - workspaceRect.top);
    }
});

// Event listener para finalizar a conexão do cabo
workspace.addEventListener('mouseup', (e) => {
    if (drawingCable) {
        drawingCable = false;

        const endPort = e.target.classList.contains('port') ? e.target : null;

        if (startPort && endPort && startPort !== endPort) {
            const startType = startPort.dataset.portType;
            const endType = endPort.dataset.portType;

            const existingConnection = connections.find(conn =>
                (conn.startPortId === startPort.id && conn.endPortId === endPort.id) ||
                (conn.startPortId === endPort.id && conn.endPortId === startPort.id)
            );

            if (existingConnection) {
                removeTempCable();
                console.warn("Conexão já existe.");
                return;
            }
            
            let isValidConnection = false;
            
            // Conexão de Energia: power-out (equipamentos) <-> power-in (tomada)
            if ((startType === 'power-out' && endType === 'power-in') ||
                (startType === 'power-in' && endType === 'power-out')) {
                isValidConnection = true;
            }
            // Conexão de Dados:
            // WAN (roteador) <-> LAN-OUT (ONU ou outro roteador)
            else if ((startType === 'wan' && endType === 'lan-out') ||
                     (startType === 'lan-out' && endType === 'wan')) {
                isValidConnection = true;
            }
            // LAN-OUT (roteador/ONU/roteador secundário) <-> LAN-IN (TV/Notebook)
            else if ((startType === 'lan-out' && endType === 'lan-in') ||
                     (startType === 'lan-in' && endType === 'lan-out')) {
                isValidConnection = true;
            }
            // PON (ONU) <-> PON (outra ONU ou OLT - OLT não existe, mas a regra sim)
            else if (startType === 'pon' && endType === 'pon') {
                isValidConnection = true;
            }
            // LAN-OUT (roteador) <-> LAN-OUT (roteador secundário)
            else if (startType === 'lan-out' && endType === 'lan-out') {
                // Permite conexões LAN-LAN entre roteadores para cascading
                isValidConnection = true;
            }

            if (isValidConnection) {
                removeTempCable();
                createPermanentCable(startPort, endPort);
            } else {
                console.warn(`Conexão inválida: ${startType} com ${endType}`);
                removeTempCable();
            }
        } else {
            removeTempCable(); // Se não conectou a nada válido ou na mesma porta
        }
        startPort = null;
    }
});

function removeTempCable() {
    if (tempCableLine && tempCableLine.parentElement) {
        tempCableLine.parentElement.removeChild(tempCableLine);
        tempCableLine = null;
    }
}

function createPermanentCable(port1, port2) {
    const svg = document.getElementById('svg-canvas');
    const cable = document.createElementNS("http://www.w3.org/2000/svg", "line");
    const cableId = `cable-${Date.now()}`;

    const p1Center = getPortCenter(port1);
    const p2Center = getPortCenter(port2);

    cable.setAttribute("id", cableId);
    cable.setAttribute("x1", p1Center.x);
    cable.setAttribute("y1", p1Center.y);
    cable.setAttribute("x2", p2Center.x);
    cable.setAttribute("y2", p2Center.y);
    cable.setAttribute("class", "permanent-cable");
    cable.style.pointerEvents = "all"; // Permite clique no cabo

    svg.appendChild(cable);

    connections.push({
        id: cableId,
        startPortId: port1.id,
        endPortId: port2.id
    });

    cable.addEventListener('click', (e) => {
        e.stopPropagation(); // Evita que o clique no cabo propague para o workspace
        if (confirm("Deseja remover este cabo?")) {
            removeCable(cableId);
        }
    });

    updateConnectedPortLights(port1.id, port2.id, true);
}

function removeCable(cableId) {
    const cableElement = document.getElementById(cableId);
    if (cableElement && cableElement.parentElement) {
        cableElement.parentElement.removeChild(cableElement);
        const connectionIndex = connections.findIndex(c => c.id === cableId);
        if (connectionIndex > -1) {
            const removedConnection = connections.splice(connectionIndex, 1)[0];
            updateConnectedPortLights(removedConnection.startPortId, removedConnection.endPortId, false, cableId); // Passa o cableId para exclusão
        }
    }
}

// Retorna o centro da div .port ou da div #power-outlet-port
function getPortCenter(portElement) {
    if (!portElement) return { x: 0, y: 0 }; // Adicionado verificação de nulidade
    const rect = portElement.getBoundingClientRect();
    const workspaceRect = workspace.getBoundingClientRect();
    return {
        x: (rect.left + rect.right) / 2 - workspaceRect.left,
        y: (rect.top + rect.bottom) / 2 - workspaceRect.top
    };
}


// --- FUNÇÃO PARA ATUALIZAR LUZES DE PORTAS CONECTADAS ---
function updateConnectedPortLights(port1Id, port2Id, isConnected, removedCableId = null) {
    const port1 = document.getElementById(port1Id);
    const port2 = document.getElementById(port2Id);

    if (!port1 || !port2) {
        console.warn("Uma das portas não foi encontrada:", port1Id, port2Id);
        return;
    }

    // Pega o elemento pai .dragged-equipment ou #power-outlet
    const getParentEquipment = (port) => {
        return port.closest('.dragged-equipment') || (port.id === 'power-outlet-port' ? document.getElementById('power-outlet') : null);
    };

    const eq1 = getParentEquipment(port1);
    const eq2 = getParentEquipment(port2);

    const eq1Id = eq1?.id;
    const eq2Id = eq2?.id;

    const eq1Type = eq1?.dataset.equipmentType || (eq1Id === 'power-outlet' ? 'power-outlet' : null);
    const eq2Type = eq2?.dataset.equipmentType || (eq2Id === 'power-outlet' ? 'power-outlet' : null);

    // Determina se os equipamentos associados estão ligados (se houver)
    const getPowerLightState = (eqId, eqType) => {
        if (!eqId || !eqType) return false;
        if (eqId === 'power-outlet') return document.getElementById('power-outlet-light')?.classList.contains('verde');

        let pwrLightSuffix;
        if (eqType.includes('roteador')) pwrLightSuffix = 'pwrR';
        else if (eqType === 'onu') pwrLightSuffix = 'pwrO';
        else if (eqType === 'tv' || eqType === 'notebook') pwrLightSuffix = 'pwrD';
        else return false;
        
        return getLuzElement(eqId, pwrLightSuffix)?.classList.contains('verde');
    };

    // Estilo visual da porta (o pequeno quadrado)
    const port1Visual = port1;
    const port2Visual = port2;

    if (isConnected) {
        port1Visual.style.backgroundColor = '#4CAF50'; // Verde
        port1Visual.style.borderColor = '#388E3C';
        port2Visual.style.backgroundColor = '#4CAF50';
        port2Visual.style.borderColor = '#388E3C';

        // Lógica de energia
        if ((port1.dataset.portType === 'power-out' && port2.dataset.portType === 'power-in') ||
            (port1.dataset.portType === 'power-in' && port2.dataset.portType === 'power-out')) {
            
            // Acende a luz da tomada
            const powerOutletLight = document.getElementById('power-outlet-light');
            if (powerOutletLight) powerOutletLight.className = 'luz verde';

            // Liga o equipamento conectado (seja eq1 ou eq2)
            if (eq1Id && eq1Type && eq1Id !== 'power-outlet') {
                toggleEquipmentPower(eq1Id, eq1Type, true); 
            }
            if (eq2Id && eq2Type && eq2Id !== 'power-outlet') {
                toggleEquipmentPower(eq2Id, eq2Type, true);
            }
        } 
        
        // Se ambos os equipamentos estão ligados (considerando a tomada como sempre ligada), acende luzes de dados
        const eq1IsOn = getPowerLightState(eq1Id, eq1Type);
        const eq2IsOn = getPowerLightState(eq2Id, eq2Type);

        if (eq1IsOn && eq2IsOn) {
            // Luzes do Roteador Principal
            if (eq1Type === 'roteador' || eq2Type === 'roteador') {
                const roteadorId = eq1Type === 'roteador' ? eq1Id : eq2Id;
                if (roteadorId) {
                    const wanLight = getLuzElement(roteadorId, 'wanR');
                    const lanLight = getLuzElement(roteadorId, 'lanR'); // Luz única para as 4 LANs
                    
                    // Se for WAN-LAN
                    if ((port1.dataset.portType === 'wan' && port2.dataset.portType === 'lan-out') ||
                        (port1.dataset.portType === 'lan-out' && port2.dataset.portType === 'wan')) {
                        if (wanLight) wanLight.className = 'luz verde';
                        if (lanLight) lanLight.className = 'luz verde'; 
                    }
                    // Se for LAN-LAN (entre roteadores ou para TV/Notebook)
                    else if ((port1.dataset.portType === 'lan-out' && (port2.dataset.portType === 'lan-out' || port2.dataset.portType === 'lan-in')) ||
                             (port1.dataset.portType === 'lan-in' && port2.dataset.portType === 'lan-out')) {
                        if (lanLight) lanLight.className = 'luz verde';
                    }
                }
            }
            // Luzes da ONU
            if (eq1Type === 'onu' || eq2Type === 'onu') {
                const onuId = eq1Type === 'onu' ? eq1Id : eq2Id;
                if (onuId) {
                    const ponLight = getLuzElement(onuId, 'ponO');
                    const losLight = getLuzElement(onuId, 'losO');
                    const lanLight = getLuzElement(onuId, 'lanO');
                    
                    if (ponLight) { 
                        if (!(losLight && losLight.classList.contains("piscar-vermelho"))) {
                            ponLight.className = 'luz verde piscar-verde';
                        }
                    }
                    if (lanLight) { 
                        if ((port1.dataset.portType === 'lan-out' && port2.dataset.portType === 'lan-out') ||
                            (port1.dataset.portType === 'lan-out' && port2.dataset.portType === 'wan') ||
                            (port1.dataset.portType === 'lan-in' && port2.dataset.portType === 'lan-out') ||
                            (port1.dataset.portType === 'lan-out' && port2.dataset.portType === 'lan-in') ) {
                                lanLight.className = 'luz verde';
                        }
                    }
                }
            }
            // Luzes de TV/Notebook
            if (eq1Type === 'tv' || eq1Type === 'notebook' || eq2Type === 'tv' || eq2Type === 'notebook') {
                const deviceId = (eq1Type === 'tv' || eq1Type === 'notebook') ? eq1Id : eq2Id;
                if (deviceId) {
                    const lanLight = getLuzElement(deviceId, 'lanD');
                    if (lanLight) lanLight.className = 'luz verde';
                }
            }
        }

    } else { // Conexão desconectada
        port1Visual.style.backgroundColor = port1.dataset.defaultColor;
        port1Visual.style.borderColor = '#a0a0a0';
        port2Visual.style.backgroundColor = port2.dataset.defaultColor;
        port2Visual.style.borderColor = '#a0a0a0';

        // Lógica de desligar luzes específicas e, talvez, o equipamento
        if ((port1.dataset.portType === 'power-out' && port2.dataset.portType === 'power-in') ||
            (port1.dataset.portType === 'power-in' && port2.dataset.portType === 'power-out')) {
            
            const eqDisconnectedFromPowerId = (port1.dataset.portType === 'power-out') ? eq1Id : eq2Id;
            const eqType = (port1.dataset.portType === 'power-out') ? eq1Type : eq2Type;

            // Lógica para a tomada
            const powerOutletPort = document.getElementById('power-outlet-port');
            const hasOtherConnectionsToOutlet = connections.some(conn => {
                if (conn.id === removedCableId) return false; // Ignora o cabo que está sendo removido
                return (conn.startPortId === powerOutletPort.id && document.getElementById(conn.endPortId)?.dataset.portType === 'power-out') ||
                       (conn.endPortId === powerOutletPort.id && document.getElementById(conn.startPortId)?.dataset.portType === 'power-out');
            });
            if (!hasOtherConnectionsToOutlet) { // Se não há mais nenhum equipamento conectado à tomada
                const powerOutletLight = document.getElementById('power-outlet-light');
                if (powerOutletLight) powerOutletLight.className = 'luz apagada';
            }

            // Lógica para o equipamento que foi desconectado da energia
            if (eqDisconnectedFromPowerId && eqType) {
                // Checar se há outras conexões de energia para o MESMO equipamento antes de desligar completamente
                const otherPowerConnectionsToThisEquipment = connections.some(conn => {
                    if (conn.id === removedCableId) return false; // Ignora o cabo que está sendo removido
                    const otherPort1 = document.getElementById(conn.startPortId);
                    const otherPort2 = document.getElementById(conn.endPortId);
                    
                    const otherEq1 = getParentEquipment(otherPort1);
                    const otherEq2 = getParentEquipment(otherPort2);

                    const otherEq1Id = otherEq1?.id;
                    const otherEq2Id = otherEq2?.id;

                    return ((otherEq1Id === eqDisconnectedFromPowerId && otherPort1?.dataset.portType === 'power-out' && otherPort2?.dataset.portType === 'power-in') ||
                            (otherEq2Id === eqDisconnectedFromPowerId && otherPort2?.dataset.portType === 'power-out' && otherPort1?.dataset.portType === 'power-in'));
                });

                if (!otherPowerConnectionsToThisEquipment) {
                    toggleEquipmentPower(eqDisconnectedFromPowerId, eqType, false); // Força desligamento do equipamento
                }
            }
        } else { // Conexões de dados
            // Desligar luzes de WAN/LAN/PON/LAN-D dos equipamentos envolvidos, se não houverem outras conexões ativas
            const affectedEquipments = [eq1Id, eq2Id].filter(id => id !== null);
            affectedEquipments.forEach(currentEqId => {
                const currentEq = document.getElementById(currentEqId);
                if (!currentEq) return;

                const currentEqType = currentEq.dataset.equipmentType;

                // Função auxiliar para verificar se a porta ainda tem outras conexões de dados ativas
                const hasOtherActiveDataConnections = (targetPortId) => {
                    return connections.some(conn => {
                        if (conn.id === removedCableId) return false; // Ignora o cabo que está sendo removido
                        const otherPort1 = document.getElementById(conn.startPortId);
                        const otherPort2 = document.getElementById(conn.endPortId);

                        // Se o cabo ainda existe e conecta à porta alvo E NÃO FOR CONEXÃO DE ENERGIA
                        return (otherPort1?.id === targetPortId && otherPort2?.dataset.portType !== 'power-in' && otherPort2?.dataset.portType !== 'power-out') ||
                               (otherPort2?.id === targetPortId && otherPort1?.dataset.portType !== 'power-in' && otherPort1?.dataset.portType !== 'power-out');
                    });
                };
                
                // Luzes do Roteador Principal
                if (currentEqType === 'roteador') {
                    // Check if any of the LAN ports are still connected
                    let anyLanPortStillConnected = false;
                    for (let i = 1; i <= 4; i++) {
                        if (hasOtherActiveDataConnections(`${currentEqId}-lan${i}-port`)) {
                            anyLanPortStillConnected = true;
                            break;
                        }
                    }
                    if (!anyLanPortStillConnected) {
                         const lanLight = getLuzElement(currentEqId, 'lanR');
                         if (lanLight) lanLight.className = 'luz apagada';
                    }

                    const wanPort = document.getElementById(`${currentEqId}-wan-port`);
                    if (wanPort && !hasOtherActiveDataConnections(wanPort.id)) {
                        const wanLight = getLuzElement(currentEqId, 'wanR');
                        if (wanLight) wanLight.className = 'luz apagada';
                    }
                }
                // Luzes de Roteador Secundário
                else if (currentEqType === 'roteador-secundario') {
                    const lanPort = document.getElementById(`${currentEqId}-lan-port`);
                    if (lanPort && !hasOtherActiveDataConnections(lanPort.id)) {
                        const lanLight = getLuzElement(currentEqId, 'lanR');
                        if (lanLight) lanLight.className = 'luz apagada';
                    }
                }
                // Luzes da ONU
                else if (currentEqType === 'onu') {
                    const ponPort = document.getElementById(`${currentEqId}-pon-port`);
                    const lanPort = document.getElementById(`${currentEqId}-lan-port`);
                    
                    if (ponPort && !hasOtherActiveDataConnections(ponPort.id)) {
                        const ponLight = getLuzElement(currentEqId, 'ponO');
                        if (ponLight) {
                            ponLight.className = 'luz apagada';
                            ponLight.classList.remove('piscar-verde');
                        }
                    }
                    if (lanPort && !hasOtherActiveDataConnections(lanPort.id)) {
                        const lanLight = getLuzElement(currentEqId, 'lanO');
                        if (lanLight) lanLight.className = 'luz apagada';
                    }
                }
                // Luzes de TV/Notebook
                else if (currentEqType === 'tv' || currentEqType === 'notebook') {
                    const lanPort = document.getElementById(`${currentEqId}-lan-port`);
                    if (lanPort && !hasOtherActiveDataConnections(lanPort.id)) {
                        const lanLight = getLuzElement(currentEqId, 'lanD');
                        if (lanLight) lanLight.className = 'luz apagada';
                    }
                }
            });
        }
    }
}


// --- LÓGICA DA LIXEIRA ---
trashCan.addEventListener('dragover', (e) => {
    e.preventDefault();
    if (draggedElement && draggedElement.classList.contains('dragged-equipment')) {
        trashCan.classList.add('highlight');
        draggedElement.classList.add('drag-over-trash');
    }
});

trashCan.addEventListener('dragleave', () => {
    trashCan.classList.remove('highlight');
    if (draggedElement) {
        draggedElement.classList.remove('drag-over-trash');
    }
});

trashCan.addEventListener('drop', (e) => {
    e.preventDefault();
    trashCan.classList.remove('highlight');
    if (draggedElement && draggedElement.classList.contains('dragged-equipment')) {
        draggedElement.classList.remove('drag-over-trash');
        removeElement(draggedElement.id);
        draggedElement = null;
    }
});

function removeElement(elementId) {
    const elementToRemove = document.getElementById(elementId);
    if (elementToRemove) {
        // Remover todos os cabos conectados a qualquer porta dentro do elemento a ser removido
        const portsInElement = elementToRemove.querySelectorAll('.port');
        const portIdsInElement = Array.from(portsInElement).map(p => p.id);
        
        // Criar uma cópia das conexões para iterar e modificar o array original
        const connectionsToRemove = connections.filter(conn => 
            portIdsInElement.includes(conn.startPortId) || portIdsInElement.includes(conn.endPortId)
        );
        
        // Remove os cabos um por um, o que também atualiza as luzes
        connectionsToRemove.forEach(conn => {
            removeCable(conn.id);
        });
        
        // Lógica de desligar luz da tomada se o único equipamento conectado a ela for removido
        // (A função removeCable já deve ter cuidado com isso, mas é um fallback)
        const powerOutletPort = document.getElementById('power-outlet-port');
        const hasOtherConnectionsToOutlet = connections.some(conn => { // Verifica após todas as remoções
            return (conn.startPortId === powerOutletPort.id && document.getElementById(conn.endPortId)?.dataset.portType === 'power-out') ||
                   (conn.endPortId === powerOutletPort.id && document.getElementById(conn.startPortId)?.dataset.portType === 'power-out');
        });

        if (!hasOtherConnectionsToOutlet) { // Se não há mais nenhum equipamento conectado à tomada
            const powerOutletLight = document.getElementById('power-outlet-light');
            if (powerOutletLight) powerOutletLight.className = 'luz apagada';
        }
        
        elementToRemove.parentElement.removeChild(elementToRemove);
        console.log(`Elemento ${elementId} e seus cabos associados foram removidos.`);

        if (workspace.querySelectorAll('.dragged-equipment').length === 0) {
            const initialInstruction = workspace.querySelector('h2');
            if (initialInstruction) {
                initialInstruction.style.display = 'block';
            }
        }
    }
}
// Estrutura para salvar
const networkState = {
  equipments: [],
  connections: []
};

// Para cada equipamento, salve id, tipo, posição, estado de power e luzes
function saveNetworkState() {
  networkState.equipments = Array.from(document.querySelectorAll('.dragged-equipment')).map(eq => {
    return {
      id: eq.id,
      type: eq.dataset.equipmentType,
      x: parseFloat(eq.style.left) || 0,
      y: parseFloat(eq.style.top) || 0,
      powerOn: getPowerLightState(eq.id, eq.dataset.equipmentType)
      // Pode salvar mais estados se precisar
    };
  });

  // Salvar conexões
  networkState.connections = connections.map(conn => ({ ...conn }));

  localStorage.setItem('networkState', JSON.stringify(networkState));
  alert('Estado da rede salvo!');
}

function loadNetworkState() {
  const savedState = localStorage.getItem('networkState');
  if (!savedState) {
    alert('Nenhum estado salvo encontrado!');
    return;
  }

  clearWorkspace(); // Função para limpar workspace antes de carregar (remover equipamentos e conexões)

  const state = JSON.parse(savedState);

  // Recria equipamentos
  state.equipments.forEach(eq => {
    addEquipment(eq.type, eq.id, eq.x, eq.y); // Função que já cria o equipamento na tela, mas permita passar id

    // Se o equipamento estava ligado, liga novamente
    if (eq.powerOn) {
      toggleEquipmentPower(eq.id, eq.type, true);
    } else {
      toggleEquipmentPower(eq.id, eq.type, false);
    }
  });

  // Recria conexões
  state.connections.forEach(conn => {
    const port1 = document.getElementById(conn.startPortId);
    const port2 = document.getElementById(conn.endPortId);
    if (port1 && port2) {
      createPermanentCable(port1, port2);
    }
  });

  alert('Estado da rede carregado!');
}

// Limpa o workspace (remove equipamentos e cabos)
function clearWorkspace() {
  // Remove todos os equipamentos
  document.querySelectorAll('.dragged-equipment').forEach(eq => eq.remove());

  // Remove todos os cabos SVG
  connections.forEach(conn => {
    removeCable(conn.id);
  });
  connections.length = 0;
}
