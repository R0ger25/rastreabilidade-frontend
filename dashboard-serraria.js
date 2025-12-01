// ===================================
// CONFIGURAÇÃO DA API
// ===================================

const API_URL = 'https://api-rastreabilidade-backend.onrender.com';

// ===================================
// AUTH GUARD
// ===================================

function checkAuth() {
    const token = localStorage.getItem('accessToken');
    if (!token) {
        console.log("❌ Sem token, redirecionando para login...");
        window.location.href = 'index.html';
        return;
    }
    
    verificarRole();
}

async function verificarRole() {
    const token = localStorage.getItem('accessToken');
    
    try {
        const response = await fetch(`${API_URL}/users/me`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            console.error("❌ Erro ao verificar usuário:", response.status);
            logout();
            return;
        }
        
        const user = await response.json();
        console.log("👤 Usuário verificado:", user);
        
        // Verificar se o role é 'serraria'
        if (user.role !== 'serraria') {
            alert('Acesso negado! Esta área é exclusiva para a equipe da serraria.');
            logout();
            return;
        }
        
        // Exibir nome do usuário
        document.getElementById('userName').textContent = user.email;
        
        console.log("✅ Acesso permitido para serraria!");
        
    } catch (error) {
        console.error('❌ Erro ao verificar role:', error);
        logout();
    }
}

function logout() {
    localStorage.removeItem('accessToken');
    window.location.href = 'index.html';
}

// ===================================
// INICIALIZAÇÃO
// ===================================

console.log("🏭 Dashboard Serraria carregado!");
checkAuth();