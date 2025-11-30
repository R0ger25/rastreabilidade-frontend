// ===================================
// CONFIGURAÇÃO DA API
// ===================================

const API_URL = 'https://api-rastreabilidade-backend.onrender.com'; // Substitua pela URL real do seu backend

// ===================================
// AUTH GUARD & VERIFICAÇÃO DE ROLE
// ===================================

function checkAuth() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'index.html';
        return;
    }
    
    // Verificar se o usuário é da serraria
    verificarRole();
}

async function verificarRole() {
    const token = localStorage.getItem('token');
    
    try {
        const response = await fetch(`${API_URL}/users/me`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error('Não autorizado');
        }
        
        const user = await response.json();
        
        // Verificar se o role é 'serraria'
        if (user.role !== 'serraria') {
            alert('Acesso negado! Esta área é exclusiva para a equipe da serraria.');
            logout();
            return;
        }
        
        // Exibir nome do usuário
        document.getElementById('userName').textContent = user.email;
        
    } catch (error) {
        console.error('Erro ao verificar role:', error);
        logout();
    }
}

function logout() {
    localStorage.removeItem('token');
    window.location.href = 'index.html';
}

// ===================================
// NAVEGAÇÃO ENTRE TABS
// ===================================

function showTab(tabName) {
    // Ocultar todas as tabs
    const tabs = document.querySelectorAll('.tab-content');
    tabs.forEach(tab => tab.classList.remove('active'));
    
    // Remover classe active de todos os botões
    const tabButtons = document.querySelectorAll('.tab-btn');
    tabButtons.forEach(btn => btn.classList.remove('active'));
    
    // Mostrar a tab selecionada
    document.getElementById(tabName).classList.add('active');
    
    // Adicionar classe active ao botão correspondente
    event.target.classList.add('active');
    
    // Carregar dados conforme a tab
    if (tabName === 'lotes-disponiveis') {
        carregarLotesTora();
    } else if (tabName === 'registrar-processamento') {
        carregarLotesToraNoSelect();
    } else if (tabName === 'meus-lotes') {
        carregarMeusLotesSerrados();
    }
}

// ===================================
// CARREGAR LOTES DE TORA DISPONÍVEIS
// ===================================

async function carregarLotesTora() {
    const token = localStorage.getItem('token');
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
        
        // Renderizar os lotes
        container.innerHTML = lotes.map(lote => `
            <div class="lote-card">
                <div class="lote-header">
                    <h3>${lote.id_lote_custom}</h3>
                    <span class="badge badge-success">Disponível</span>
                </div>
                <div class="lote-body">
                    <p><strong>Espécie:</strong> ${lote.especie_madeira_popular || 'Não informada'}</p>
                    <p><strong>Volume:</strong> ${lote.volume_estimado_m3} m³</p>
                    <p><strong>DOF:</strong> ${lote.numero_dof}</p>
                    <p><strong>Data Registro:</strong> ${formatarData(lote.data_hora_registro)}</p>
                    <p><strong>Coordenadas:</strong> ${lote.coordenadas_gps_lat}, ${lote.coordenadas_gps_lon}</p>
                </div>
                <div class="lote-footer">
                    <button onclick="selecionarLoteParaProcessamento(${lote.id})" class="btn-primary btn-small">
                        Processar Este Lote
                    </button>
                </div>
            </div>
        `).join('');
        
    } catch (error) {
        console.error('Erro:', error);
        container.innerHTML = '<p class="error-message">Erro ao carregar lotes de tora.</p>';
    }
}

// ===================================
// CARREGAR LOTES NO SELECT (Formulário)
// ===================================

async function carregarLotesToraNoSelect() {
    const token = localStorage.getItem('token');
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
        
        // Limpar select
        select.innerHTML = '<option value="">-- Selecione um lote --</option>';
        
        // Adicionar opções
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
// SELECIONAR LOTE PARA PROCESSAMENTO
// ===================================

function selecionarLoteParaProcessamento(loteId) {
    // Mudar para a tab de registro
    showTab('registrar-processamento');
    
    // Aguardar o select ser carregado
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
            infoElement.style.color = '#2563eb';
        } else {
            infoElement.textContent = '';
        }
    });
});

// ===================================
// SUBMETER FORMULÁRIO DE LOTE SERRADO
// ===================================

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('formLoteSerrado');
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const token = localStorage.getItem('token');
        const mensagem = document.getElementById('mensagemProcessamento');
        
        // Coletar dados do formulário
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
            
            // Sucesso
            mensagem.className = 'message success';
            mensagem.textContent = `✅ Lote serrado ${data.id_lote_serrado_custom} registrado com sucesso!`;
            mensagem.style.display = 'block';
            
            // Limpar formulário
            form.reset();
            
            // Redirecionar após 2 segundos
            setTimeout(() => {
                showTab('meus-lotes');
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
// CARREGAR MEUS LOTES SERRADOS
// ===================================

async function carregarMeusLotesSerrados() {
    const token = localStorage.getItem('token');
    const container = document.getElementById('meusLotesSerradosList');
    
    try {
        const response = await fetch(`${API_URL}/lotes_serrada/`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error('Erro ao carregar lotes serrados');
        }
        
        const lotes = await response.json();
        
        if (lotes.length === 0) {
            container.innerHTML = '<p class="empty-state">Você ainda não processou nenhum lote.</p>';
            return;
        }
        
        // Renderizar os lotes
        container.innerHTML = lotes.map(lote => `
            <div class="lote-item">
                <div class="lote-item-header">
                    <h3>${lote.id_lote_serrado_custom}</h3>
                    <span class="badge badge-info">Processado</span>
                </div>
                <div class="lote-item-body">
                    <div class="info-grid">
                        <div>
                            <strong>Lote de Tora Origem:</strong>
                            <p>ID: ${lote.id_lote_tora_origem}</p>
                        </div>
                        <div>
                            <strong>Volume de Saída:</strong>
                            <p>${lote.volume_saida_m3} m³</p>
                        </div>
                        <div>
                            <strong>Tipo de Produto:</strong>
                            <p>${lote.tipo_produto || 'Não informado'}</p>
                        </div>
                        <div>
                            <strong>Dimensões:</strong>
                            <p>${lote.dimensoes || 'Não informadas'}</p>
                        </div>
                        <div>
                            <strong>Data de Recebimento:</strong>
                            <p>${formatarData(lote.data_recebimento_tora)}</p>
                        </div>
                        <div>
                            <strong>Data de Processamento:</strong>
                            <p>${formatarData(lote.data_processamento)}</p>
                        </div>
                    </div>
                    ${lote.dados_tratamento ? `
                        <div class="tratamento-info">
                            <strong>Tratamento Aplicado:</strong>
                            <p>${lote.dados_tratamento}</p>
                        </div>
                    ` : ''}
                </div>
            </div>
        `).join('');
        
    } catch (error) {
        console.error('Erro:', error);
        container.innerHTML = '<p class="error-message">Erro ao carregar seus lotes serrados.</p>';
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