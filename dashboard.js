document.addEventListener("DOMContentLoaded", () => {

    // ... (API_BASE_URL e outras constantes) ...
    const API_BASE_URL = "https://api-rastreabilidade-backend.onrender.com"; 
    const welcomeMessage = document.getElementById("welcome-message");
    const logoutButton = document.getElementById("logout-button");
    const toraForm = document.getElementById("tora-form");
    const formMessage = document.getElementById("form-message");
    const submitButton = document.getElementById("tora-submit-button");
    
    // Pega o wrapper do conteúdo
    const dashboardContent = document.getElementById("dashboard-content");

    // 1. "AUTH GUARD" (sem mudança)
    const token = localStorage.getItem("accessToken");
    if (!token) {
        window.location.href = "index.html"; // Redireciona imediatamente
        return; 
    }

    // 2. BUSCAR DADOS DO USUÁRIO E FAZER AUTORIZAÇÃO
    async function fetchUserInfoAndAuthorize() {
        try {
            const response = await fetch(`${API_BASE_URL}/users/me`, {
                method: "GET",
                headers: { "Authorization": `Bearer ${token}` }
            });

            if (!response.ok) {
                throw new Error("Sessão inválida ou expirada.");
            }

            const user = await response.json();

            // VERIFICAÇÃO DE AUTORIZAÇÃO (sem mudança)
            if (user.role !== "tecnico") {
                alert("Acesso Negado: Esta página é apenas para Técnicos de Campo.");
                localStorage.removeItem("accessToken"); 
                window.location.href = "index.html"; 
                return; // Para a execução antes de mostrar o conteúdo
            }
            
            // ==========================================================
            // SUCESSO! Usuário é técnico. MOSTRAR CONTEÚDO AGORA.
            // ==========================================================
            welcomeMessage.textContent = `Olá, ${user.email} (Técnico)`;
            // Remove a classe que esconde e adiciona a que mostra
            dashboardContent.classList.remove("content-hidden");
            dashboardContent.classList.add("content-visible");
            // ==========================================================

        } catch (error) {
            // Se falhar, redireciona para o login (sem mostrar conteúdo)
            localStorage.removeItem("accessToken");
            alert(error.message); // Opcional: mostrar erro antes de redirecionar
            window.location.href = "index.html";
        }
    }

    // 3. LÓGICA DO LOGOUT (sem mudança)
    logoutButton.addEventListener("click", () => {
        localStorage.removeItem("accessToken"); 
        alert("Logout realizado com sucesso.");
        window.location.href = "index.html";
    });

    // 4. LÓGICA DO FORMULÁRIO (Registrar Tora - sem mudança)
    toraForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        submitButton.disabled = true;
        submitButton.textContent = "Registrando...";
        formMessage.textContent = "";
        formMessage.className = "form-message"; 

        const loteData = {
            coordenadas_gps_lat: parseFloat(document.getElementById("lat").value),
            coordenadas_gps_lon: parseFloat(document.getElementById("lon").value),
            numero_dof: document.getElementById("dof").value,
            numero_licenca_ambiental: document.getElementById("licenca").value,
            especie_madeira_popular: document.getElementById("especie").value || null,
            volume_estimado_m3: parseFloat(document.getElementById("volume").value)
        };

        try {
            const response = await fetch(`${API_BASE_URL}/lotes_tora/`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`, 
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(loteData)
            });

            if (!response.ok) {
                if(response.status === 401) {
                    // Este erro ainda pode acontecer se o token expirar
                    // entre o carregamento da página e o envio do form.
                    throw new Error("Sua sessão expirou ou é inválida. Faça login novamente.");
                }
                const errorData = await response.json();
                throw new Error(errorData.detail || "Falha ao registrar o lote.");
            }

            const novoLote = await response.json();
            
            formMessage.textContent = `Lote ${novoLote.id_lote_custom} registrado com sucesso!`;
            formMessage.classList.add("success");
            toraForm.reset(); 

        } catch (error) {
            formMessage.textContent = error.message;
            formMessage.classList.add("error");
            formMessage.style.display = "block";
             // Se o erro for de sessão, desloga
             if (error.message.includes("Sua sessão expirou")) {
                localStorage.removeItem("accessToken");
                setTimeout(() => { window.location.href = "index.html"; }, 3000); // Espera 3s
            }
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = "Registrar Lote";
        }
    });

    // --- INICIALIZAÇÃO DA PÁGINA ---
    // Chama a função que busca o usuário E verifica o cargo
    fetchUserInfoAndAuthorize(); 
});