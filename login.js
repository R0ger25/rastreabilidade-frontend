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

        const formData = new FormData(loginForm);
        const bodyData = new URLSearchParams(formData);

        try {
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
                } else {
                    errorMsg = `Erro ${response.status}: Não foi possível conectar à API.`;
                }
                throw new Error(errorMsg);
            }

            // SUCESSO!
            const data = await response.json();
            
            localStorage.setItem("accessToken", data.access_token);
            window.location.href = "dashboard.html"; // Redireciona para a página protegida

        } catch (error) {
            errorMessage.textContent = error.message;
            errorMessage.style.display = "block";
        } finally {
            loginButton.disabled = false;
            loginButton.textContent = "Entrar";
        }
    });
});