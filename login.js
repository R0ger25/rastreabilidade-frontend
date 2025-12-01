document.addEventListener("DOMContentLoaded", () => {
    
    // ==========================================================
    // ATENÇÃO: COLOQUE A URL DA SUA API DO RENDER AQUI
    // ==========================================================
    const API_BASE_URL = "https://api-rastreabilidade-backend.onrender.com"; 
    // ==========================================================

    const loginForm = document.getElementById("login-form");
    const loginButton = document.getElementById("login-button");
    const errorMessage = document.getElementById("error-message");

    loginForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        loginButton.disabled = true;
        loginButton.textContent = "Aguarde...";
        errorMessage.textContent = "";
        errorMessage.style.display = "none";

        // Pegar valores dos inputs
        const email = document.getElementById("email").value;
        const senha = document.getElementById("senha").value;
        
        // Criar FormData com os nomes que o backend espera
        const bodyData = new URLSearchParams();
        bodyData.append('username', email);  // Backend espera 'username'
        bodyData.append('password', senha);  // Backend espera 'password'

        try {
            // PASSO 1: Fazer login
            const response = await fetch(`${API_BASE_URL}/token`, {
                method: "POST",
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                body: bodyData
            });

            if (!response.ok) {
                let errorMsg = "Ocorreu um erro desconhecido.";
                if (response.status === 401) {
                    try {
                        const errorData = await response.json();
                        errorMsg = errorData.detail || "Email ou senha incorretos.";
                    } catch (e) {
                        errorMsg = "Email ou senha incorretos.";
                    }
                } else if (response.status === 422) {
                    errorMsg = "Dados inválidos. Verifique se preencheu email e senha corretamente.";
                } else {
                    errorMsg = `Erro ${response.status}: Não foi possível conectar à API.`;
                }
                throw new Error(errorMsg);
            }

            // SUCESSO no login!
            const data = await response.json();
            const token = data.access_token;
            
            // Salvar token
            localStorage.setItem("accessToken", token);
            
            // PASSO 2: Verificar o role do usuário
            const userResponse = await fetch(`${API_BASE_URL}/users/me`, {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                }
            });

            if (!userResponse.ok) {
                throw new Error("Não foi possível verificar suas permissões.");
            }

            const userData = await userResponse.json();
            
            // PASSO 3: Redirecionar baseado no role
            let redirectUrl;
            
            if (userData.role === 'tecnico') {
                redirectUrl = "dashboard.html";
            } else if (userData.role === 'serraria') {
                redirectUrl = "dashboard-serraria.html";
            } else if (userData.role === 'fabrica') {
                redirectUrl = "dashboard-fabrica.html";
            } else {
                throw new Error("Tipo de usuário não reconhecido.");
            }
            
            // Redirecionar
            window.location.href = redirectUrl;

        } catch (error) {
            console.error("Erro no login:", error);
            errorMessage.textContent = error.message;
            errorMessage.style.display = "block";
            
            // Limpar token se houver erro
            localStorage.removeItem("accessToken");
            
        } finally {
            loginButton.disabled = false;
            loginButton.textContent = "Entrar";
        }
    });
});