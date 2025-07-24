document.addEventListener("DOMContentLoaded", () => {
    const workspace = document.getElementById("workspace");
    const tomada = document.getElementById("power-outlet");

    const actions = {
        "New Topology": () => {
            workspace.innerHTML = "";
            if (tomada && !workspace.contains(tomada)) {
                workspace.appendChild(tomada);
            }
            console.log("Nova Topologia");
        },
        "Save": () => saveAsPng("topologia.png"),
        "Save As...": () => {
            const name = prompt("Nome do arquivo:", "minha-topologia.png");
            if (name) saveAsPng(name.endsWith(".png") ? name : name + ".png");
        },
        "Print": () => {
            const originalVisibility = tomada ? tomada.style.visibility : '';
            if (tomada) tomada.style.visibility = "visible";

            // Mostra roteador, ONU, etc.
            document.querySelectorAll(".device-icon").forEach(el => el.style.visibility = "visible");

            if (typeof html2canvas !== 'undefined') {
                html2canvas(workspace, { useCORS: true }).then(canvas => {
                    const printWindow = window.open('', '', 'width=800,height=600');
                    printWindow.document.write(`
                        <html>
                        <head><title>Impressão da Topologia</title></head>
                        <body style="margin:0"><img src="${canvas.toDataURL("image/png")}" style="width:100%"/></body>
                        </html>
                    `);
                    printWindow.document.close();
                    printWindow.focus();
                    printWindow.print();
                    if (tomada) tomada.style.visibility = originalVisibility;
                });
            } else {
                alert("A biblioteca html2canvas não está carregada.");
            }
        },
        "Exit": () => {
            if (confirm("Deseja sair da aplicação?")) {
                window.close();
            }
        },
        "Undo": () => document.execCommand("undo"),
        "Redo": () => document.execCommand("redo"),
        "Cut": () => document.execCommand("cut"),
        "Copy": () => document.execCommand("copy"),
        "Paste": () => document.execCommand("paste"),
        "Delete": () => {
            const selected = document.querySelector(".selected");
            if (selected) {
                selected.remove();
            }
        },
        "Select All": () => {
            alert("Selecionar tudo (funcionalidade será implementada).");
        },
        "Zoom In": () => zoom(1.1),
        "Zoom Out": () => zoom(0.9),
        "Fit to Window": () => workspace.style.transform = "scale(1)",
        "Actual Size": () => workspace.style.transform = "scale(1)",
        "Toolbar": () => alert("Alternar barra de ferramentas (em breve)"),
        "Status Bar": () => alert("Alternar barra de status (em breve)"),
        "Open...": () => alert("Função de abrir arquivos será implementada."),
        "Import": () => alert("Importar topologia será implementado."),
        "Export": () => alert("Exportar topologia será implementado."),
        "Packet Capture": () => alert("Packet Capture será implementado."),
        "IP Address Calculator": () => alert("Calculadora de IP será implementada."),
        "Subnet Mask Calculator": () => alert("Calculadora de Máscara será implementada."),
        "Start configuration": (eventTarget) => {
            const parentMenuItem = eventTarget.closest('.menu-item');
            if (parentMenuItem) {
                const deviceType = parentMenuItem.textContent.trim().split('\n')[0].trim().toLowerCase();
                if (deviceType === 'router') {
                    window.location.href = 'roteador.html';
                } else if (deviceType === 'television') {
                    window.location.href = 'tv.html';
                } else if (deviceType === 'computer') {
                    window.location.href = 'pc.html';
                } else {
                    alert(`Configuração para ${deviceType} será implementada.`);
                }
            }
        },
        "Start the test": () => {
            window.open("https://www.speedtest.net/pt", "_blank");
        },
        "About simulator": () => {
            window.location.href = 'about.html';
        }
    };

    function saveAsPng(filename) {
        const originalVisibility = tomada ? tomada.style.visibility : '';
        if (tomada) tomada.style.visibility = "visible";

        // Mostra ícones visíveis
        document.querySelectorAll(".device-icon").forEach(el => el.style.visibility = "visible");

        if (typeof html2canvas !== 'undefined') {
            html2canvas(workspace, { useCORS: true }).then(canvas => {
                const link = document.createElement("a");
                link.download = filename;
                link.href = canvas.toDataURL("image/png");
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                if (tomada) tomada.style.visibility = originalVisibility;
            });
        } else {
            alert("A biblioteca html2canvas não está carregada.");
        }
    }

    function zoom(factor) {
        const currentScale = workspace.style.transform.match(/scale\(([^)]+)\)/);
        const scale = currentScale ? parseFloat(currentScale[1]) : 1;
        workspace.style.transform = `scale(${scale * factor})`;
    }

    // Dropdown dos menus
    const allMenuItems = document.querySelectorAll('.top-navbar .menu-item');
    const mainDropdownButton = document.querySelector('.right-section .dropdown-button');
    const mainDropdownContent = document.querySelector('.right-section .dropdown-content');

    allMenuItems.forEach(item => {
        const dropdownContent = item.querySelector('.dropdown-content');
        if (dropdownContent) {
            item.addEventListener('click', (event) => {
                event.stopPropagation();
                allMenuItems.forEach(otherItem => {
                    if (otherItem !== item) {
                        otherItem.classList.remove('active');
                    }
                });
                if (mainDropdownContent) {
                    mainDropdownContent.classList.remove('active');
                }
                item.classList.toggle('active');
            });
        }
    });

    if (mainDropdownButton && mainDropdownContent) {
        mainDropdownButton.addEventListener('click', (event) => {
            event.stopPropagation();
            allMenuItems.forEach(item => item.classList.remove('active'));
            mainDropdownContent.classList.toggle('active');
        });
    }

    document.addEventListener('click', (event) => {
        allMenuItems.forEach(item => item.classList.remove('active'));
        if (mainDropdownContent && !mainDropdownContent.contains(event.target) && !mainDropdownButton.contains(event.target)) {
            mainDropdownContent.classList.remove('active');
        }
    });

    // Ações do dropdown
    document.querySelectorAll(".top-navbar .dropdown-content a").forEach(link => {
        link.addEventListener("click", e => {
            e.preventDefault();
            e.stopPropagation();
            const actionText = e.target.innerText.trim();
            if (actions[actionText]) {
                actions[actionText](e.target);
            } else {
                alert(`Ação "${actionText}" não mapeada.`);
            }
            const parentDropdownContent = e.target.closest('.dropdown-content');
            if (parentDropdownContent) {
                const parentMenuItem = parentDropdownContent.closest('.menu-item');
                if (parentMenuItem) parentMenuItem.classList.remove('active');
                const parentMainDropdown = parentDropdownContent.closest('.right-section');
                if (parentMainDropdown) mainDropdownContent.classList.remove('active');
            }
        });
    });

    // Toolbar
    document.querySelectorAll(".toolbar .icon-button").forEach(button => {
        button.addEventListener("click", e => {
            e.stopPropagation();
            const title = button.title.trim();
            let actionToPerform = '';
            if (title === 'New') actionToPerform = 'New Topology';
            else if (title === 'Save') actionToPerform = 'Save';
            else if (title === 'Save As') actionToPerform = 'Save As...';
            else if (title === 'Delete') actionToPerform = 'Delete';
            else if (title === 'Undo') actionToPerform = 'Undo';
            else if (title === 'Redo') actionToPerform = 'Redo';
            else if (title === 'Print') actionToPerform = 'Print';
            else if (title === 'Zoon+') actionToPerform = 'Zoom In';
            else if (title === 'Zoon-') actionToPerform = 'Zoom Out';
            if (actions[actionToPerform]) {
                actions[actionToPerform]();
            } else if (actionToPerform) {
                alert(`Ação "${actionToPerform}" não implementada.`);
            }
        });
    });

    if (tomada) {
        tomada.style.visibility = "visible";
    }
});
document.addEventListener("DOMContentLoaded", () => {
    const btnPrint = document.querySelector('button[title="Pint"]');
    const workspace = document.getElementById("workspace");

    if (btnPrint && workspace) {
        btnPrint.addEventListener("click", () => {
            // Garante que todos os ícones estejam visíveis antes da captura
            document.querySelectorAll(".device-icon").forEach(icon => {
                icon.style.visibility = "visible";
            });

            // Usa html2canvas para capturar o conteúdo do workspace
            html2canvas(workspace, {
                useCORS: true,
                allowTaint: true,
                backgroundColor: null,
                scale: 2
            }).then(canvas => {
                const imgData = canvas.toDataURL("image/png");

                const printWindow = window.open('', '_blank');
                printWindow.document.write(`
                    <html>
                    <head>
                        <title>Impressão da Topologia</title>
                        <style>body{margin:0;padding:0;}</style>
                    </head>
                    <body>
                        <img src="${imgData}" style="width:100%;"/>
                    </body>
                    </html>
                `);
                printWindow.document.close();
                printWindow.focus();
                printWindow.onload = () => {
                    printWindow.print();
                };
            });
        });
    }
});
