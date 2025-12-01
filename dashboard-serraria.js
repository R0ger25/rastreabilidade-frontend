// ===================================
// CONFIGURAÇÃO DA API
// ===================================

const API_URL = 'https://api-rastreabilidade-backend.onrender.com';

// ===================================
// AUTH GUARD & VERIFICAÇÃO DE ROLE
// ===================================

function checkAuth() {
    const token = localStorage.getItem('accessToken');
    if (!token) {
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
            logout();
            return;
        }
        
        const user = await response.json();
        
        if (user.role !== 'serraria') {
            alert('Acesso negado! Esta área é exclusiva para a equipe da serraria.');
            logout();
            return;
        }
        
        document.getElementById('userName').textContent = user.email;
        
    } catch (error) {
        console.error('Erro ao verificar role:', error);
        logout();
    }
}

function logout() {
    localStorage.removeItem('accessToken');
    window.location.href = 'index.html';
}

// ===================================
// NAVEGAÇÃO ENTRE TABS
// ===================================

function showTab(tabName) {
    // Ocultar todas as tabs
    const tabs = document.querySelectorAll('.tab-content');
    tabs.forEach(tab => tab.classList.remove('active'));
    
    const tabButtons = document.querySelectorAll('.tab-btn');
    tabButtons.forEach(btn => btn.classList.remove('active'));
    
    // Mostrar a tab selecionada
    document.getElementById(tabName).classList.add('active');
    event.target.classList.add('active');
    
    // Carregar dados conforme a tab
    if (tabName === 'lotes-disponiveis') {
        carregarLotesTora();
    } else if (tabName === 'registrar') {
        carregarLotesToraNoSelect();
    } else if (tabName === 'historico') {
        carregarHistorico();
    }
}

// ===================================
// CARREGAR LOTES DE TORA DISPONÍVEIS
// ===================================

async function carregarLotesTora() {
    const token = localStorage.getItem('accessToken');
    const container = document.getElementById('lotesToraList');
    
    try {
        const response = await fetch(`${API_URL}/lotes_tora/`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error('Erro ao carregar lotes de tora');
        }
        
        const lotes = await response.json();
        
        if (lotes.length === 0) {
            container.innerHTML = '<p class="empty-state">Nenhum lote de tora disponível no momento.</p>';
            return;
        }
        
        container.innerHTML = lotes.map(lote => `
            <div class="lote-card">
                <h3>${lote.id_lote_custom}</h3>
                <p><strong>Espécie:</strong> ${lote.especie_madeira_popular || 'Não informada'}</p>
                <p><strong>Volume:</strong> ${lote.volume_estimado_m3} m³</p>
                <p><strong>DOF:</strong> ${lote.numero_dof}</p>
                <p><strong>Data:</strong> ${formatarData(lote.data_hora_registro)}</p>
                <button onclick="selecionarLote(${lote.id})" class="btn-primary">
                    Processar Este Lote
                </button>
            </div>
        `).join('');
        
    } catch (error) {
        console.error('Erro:', error);
        container.innerHTML = '<p class="empty-state">Erro ao carregar lotes de tora.</p>';
    }
}

// ===================================
// CARREGAR LOTES NO SELECT
// ===================================

async function carregarLotesToraNoSelect() {
    const token = localStorage.getItem('accessToken');
    const select = document.getElementById('loteToraOrigem');
    
    try {
        const response = await fetch(`${API_URL}/lotes_tora/`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error('Erro ao carregar lotes');
        }
        
        const lotes = await response.json();
        
        select.innerHTML = '<option value="">-- Selecione um lote --</option>';
        
        lotes.forEach(lote => {
            const option = document.createElement('option');
            option.value = lote.id;
            option.textContent = `${lote.id_lote_custom} - ${lote.especie_madeira_popular || 'N/A'} - ${lote.volume_estimado_m3} m³`;
            option.dataset.volume = lote.volume_estimado_m3;
            option.dataset.especie = lote.especie_madeira_popular;
            select.appendChild(option);
        });
        
    } catch (error) {
        console.error('Erro:', error);
    }
}

// ===================================
// SELECIONAR LOTE PARA PROCESSAR
// ===================================

function selecionarLote(loteId) {
    showTab('registrar');
    setTimeout(() => {
        const select = document.getElementById('loteToraOrigem');
        select.value = loteId;
        select.dispatchEvent(new Event('change'));
    }, 500);
}

// ===================================
// ATUALIZAR INFO DO LOTE SELECIONADO
// ===================================

document.addEventListener('DOMContentLoaded', () => {
    const select = document.getElementById('loteToraOrigem');
    
    select.addEventListener('change', (e) => {
        const selectedOption = e.target.options[e.target.selectedIndex];
        const infoElement = document.getElementById('infoLoteSelecionado');
        
        if (selectedOption.value) {
            const volume = selectedOption.dataset.volume;
            const especie = selectedOption.dataset.especie;
            infoElement.textContent = `Espécie: ${especie} | Volume disponível: ${volume} m³`;
            infoElement.style.color = '#059669';
        } else {
            infoElement.textContent = '';
        }
    });
});

// ===================================
// SUBMETER FORMULÁRIO
// ===================================

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('formLoteSerrado');
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const token = localStorage.getItem('accessToken');
        const mensagem = document.getElementById('mensagemProcessamento');
        
        const formData = {
            id_lote_tora_origem: parseInt(document.getElementById('loteToraOrigem').value),
            data_recebimento_tora: document.getElementById('dataRecebimento').value,
            volume_saida_m3: parseFloat(document.getElementById('volumeSaida').value),
            tipo_produto: document.getElementById('tipoProduto').value || null,
            dimensoes: document.getElementById('dimensoes').value || null,
            dados_tratamento: document.getElementById('dadosTratamento').value || null
        };
        
        try {
            const response = await fetch(`${API_URL}/lotes_serrada/`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.detail || 'Erro ao registrar lote serrado');
            }
            
            mensagem.className = 'message success';
            mensagem.textContent = `✅ Lote serrado ${data.id_lote_serrado_custom} registrado com sucesso!`;
            mensagem.style.display = 'block';
            
            form.reset();
            
            setTimeout(() => {
                showTab('historico');
            }, 2000);
            
        } catch (error) {
            console.error('Erro:', error);
            mensagem.className = 'message error';
            mensagem.textContent = `❌ ${error.message}`;
            mensagem.style.display = 'block';
        }
    });
});

// ===================================
// CARREGAR HISTÓRICO
// ===================================

async function carregarHistorico() {
    const token = localStorage.getItem('accessToken');
    const container = document.getElementById('historicoList');
    
    try {
        const response = await fetch(`${API_URL}/lotes_serrada/`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error('Erro ao carregar histórico');
        }
        
        const lotes = await response.json();
        
        if (lotes.length === 0) {
            container.innerHTML = '<p class="empty-state">Você ainda não processou nenhum lote.</p>';
            return;
        }
        
        container.innerHTML = lotes.map(lote => `
            <div class="lote-card">
                <h3>${lote.id_lote_serrado_custom}</h3>
                <p><strong>Lote Tora Origem:</strong> ID ${lote.id_lote_tora_origem}</p>
                <p><strong>Volume Saída:</strong> ${lote.volume_saida_m3} m³</p>
                <p><strong>Tipo:</strong> ${lote.tipo_produto || 'Não informado'}</p>
                <p><strong>Dimensões:</strong> ${lote.dimensoes || 'Não informadas'}</p>
                <p><strong>Data Processamento:</strong> ${formatarData(lote.data_processamento)}</p>
            </div>
        `).join('');
        
    } catch (error) {
        console.error('Erro:', error);
        container.innerHTML = '<p class="empty-state">Erro ao carregar histórico.</p>';
    }
}

// ===================================
// FUNÇÕES UTILITÁRIAS
// ===================================

function formatarData(dataISO) {
    const data = new Date(dataISO);
    return data.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// ===================================
// INICIALIZAÇÃO
// ===================================

checkAuth();
carregarLotesTora();