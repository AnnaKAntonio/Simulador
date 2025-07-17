document.addEventListener("DOMContentLoaded", () => {
  const menuItems = document.querySelectorAll(".menu-item");
  const pageContent = document.getElementById("page-content");

  menuItems.forEach((item) => {
    item.addEventListener("click", () => {
      menuItems.forEach((i) => i.classList.remove("active"));
      item.classList.add("active");

      const page = item.dataset.page;

      if (page === "status") {
        pageContent.innerHTML = `
          <div class="card">
            <h3>Status</h3>
            <p>Informações.</p>
          </div>
        `;
      }

      if (page === "system-tools") {
        pageContent.innerHTML = `
          <section class="form-section">
            <h2 class="section-title">Remote Management</h2>
            <div class="form-group">
              <label for="remote-enable">Remote Management:</label>
              <input type="checkbox" id="remote-enable">
              <label for="remote-enable" class="checkbox-label">Enable</label>
            </div>

            <div class="form-group">
              <label for="http-port">Port for HTTP:</label>
              <input type="text" id="http-port" class="styled-input" placeholder="" maxlength="5" disabled>
            </div>

            <div class="form-group">
              <label for="remote-https">Remote Management via HTTPS:</label>
              <input type="checkbox" id="remote-https">
              <label for="remote-https" class="checkbox-label">Enable</label>
            </div>

            <div class="button-container">
              <button id="save-remote" class="save-button">Salvar</button>
            </div>
          </section>
        `;

        const remoteEnable = document.getElementById("remote-enable");
        const httpPort = document.getElementById("http-port");
        const remoteHttps = document.getElementById("remote-https");
        const saveBtn = document.getElementById("save-remote");

        const savedConfig = JSON.parse(localStorage.getItem("remoteConfig"));
        if (savedConfig) {
          remoteEnable.checked = savedConfig.remoteEnable;
          httpPort.disabled = !savedConfig.remoteEnable;
          httpPort.value = savedConfig.httpPort;
          remoteHttps.checked = savedConfig.remoteHttps;
        }

        remoteEnable.addEventListener("change", () => {
          httpPort.disabled = !remoteEnable.checked;
        });

        saveBtn.addEventListener("click", () => {
          const port = httpPort.value.trim();

          if (remoteEnable.checked && port !== "80" && port !== "8080") {
            alert("Porta inválida. Use apenas 80 ou 8080.");
            return;
          }

          const config = {
            remoteEnable: remoteEnable.checked,
            httpPort: port,
            remoteHttps: remoteHttps.checked,
          };

          localStorage.setItem("remoteConfig", JSON.stringify(config));
          alert("Configurações salvas com sucesso.");
        });
      }
    });
  });

  document.getElementById("reboot-btn").addEventListener("click", () => {
    localStorage.removeItem("remoteConfig");
    alert("Reiniciando... As configurações foram apagadas.");
    location.reload();
  });

  document.getElementById("logout-btn").addEventListener("click", () => {
    alert("Você foi desconectado.");
  });

  document.getElementById("upgrade-btn").addEventListener("click", () => {
    alert("Iniciando upgrade...");
  });
});
