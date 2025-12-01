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
        
        if (user.role !== 'fabrica') {
            alert('Acesso negado! Esta área é exclusiva para a equipe da fábrica.');
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
    const tabs = document.querySelectorAll('.tab-content');
    tabs.forEach(tab => tab.classList.remove('active'));
    
    const tabButtons = document.querySelectorAll('.tab-btn');
    tabButtons.forEach(btn => btn.classList.remove('active'));
    
    document.getElementById(tabName).classList.add('active');
    event.target.classList.add('active');
    
    if (tabName === 'lotes-serrados') {
        carregarLotesSerrados();
    } else if (tabName === 'fabricar') {
        carregarLotesSerradosNoSelect();
    } else if (tabName === 'produtos') {
        carregarMeusProdutos();
    }
}

// ===================================
// CARREGAR LOTES SERRADOS
// ===================================

async function carregarLotesSerrados() {
    const token = localStorage.getItem('accessToken');
    const container = document.getElementById('lotesSerradosList');
    
    try {
        const response = await fetch(`${API_URL}/lotes_serrado/`, {
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
            container.innerHTML = '<p class="empty-state">Nenhum lote serrado disponível no momento.</p>';
            return;
        }
        
        container.innerHTML = lotes.map(lote => `
            <div class="lote-card">
                <h3>${lote.id_lote_serrado_custom}</h3>
                <p><strong>Tipo:</strong> ${lote.tipo_produto || 'Não informado'}</p>
                <p><strong>Dimensões:</strong> ${lote.dimensoes || 'Não informadas'}</p>
                <p><strong>Volume:</strong> ${lote.volume_saida_m3} m³</p>
                <p><strong>Data Processamento:</strong> ${formatarData(lote.data_processamento)}</p>
                <button onclick="selecionarLote(${lote.id})" class="btn-primary">
                    Fabricar com Este Lote
                </button>
            </div>
        `).join('');
        
    } catch (error) {
        console.error('Erro:', error);
        container.innerHTML = '<p class="empty-state">Erro ao carregar lotes serrados.</p>';
    }
}

// ===================================
// CARREGAR LOTES NO SELECT
// ===================================

async function carregarLotesSerradosNoSelect() {
    const token = localStorage.getItem('accessToken');
    const select = document.getElementById('loteSerradoOrigem');
    
    try {
        const response = await fetch(`${API_URL}/lotes_serrado/`, {
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
            option.textContent = `${lote.id_lote_serrado_custom} - ${lote.tipo_produto || 'N/A'} - ${lote.volume_saida_m3} m³`;
            option.dataset.tipo = lote.tipo_produto;
            option.dataset.dimensoes = lote.dimensoes;
            select.appendChild(option);
        });
        
    } catch (error) {
        console.error('Erro:', error);
    }
}

// ===================================
// SELECIONAR LOTE
// ===================================

function selecionarLote(loteId) {
    showTab('fabricar');
    setTimeout(() => {
        const select = document.getElementById('loteSerradoOrigem');
        select.value = loteId;
        select.dispatchEvent(new Event('change'));
    }, 500);
}

// ===================================
// ATUALIZAR INFO DO LOTE SELECIONADO
// ===================================

document.addEventListener('DOMContentLoaded', () => {
    const select = document.getElementById('loteSerradoOrigem');
    
    select.addEventListener('change', (e) => {
        const selectedOption = e.target.options[e.target.selectedIndex];
        const infoElement = document.getElementById('infoLoteSerrado');
        
        if (selectedOption.value) {
            const tipo = selectedOption.dataset.tipo;
            const dimensoes = selectedOption.dataset.dimensoes;
            infoElement.textContent = `Tipo: ${tipo} | Dimensões: ${dimensoes}`;
            infoElement.style.color = '#7c3aed';
        } else {
            infoElement.textContent = '';
        }
    });
});

// ===================================
// SUBMETER FORMULÁRIO
// ===================================

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('formProduto');
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const token = localStorage.getItem('accessToken');
        const mensagem = document.getElementById('mensagemFabricacao');
        
        const formData = {
            id_lote_serrado_origem: parseInt(document.getElementById('loteSerradoOrigem').value),
            sku_produto: document.getElementById('skuProduto').value,
            nome_produto: document.getElementById('nomeProduto').value,
            dados_acabamento: document.getElementById('dadosAcabamento').value || null,
            link_qr_code: ""  // Será gerado automaticamente pelo backend
        };
        
        try {
            const response = await fetch(`${API_URL}/produtos_acabados/`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.detail || 'Erro ao fabricar produto');
            }
            
            mensagem.className = 'message success';
            mensagem.innerHTML = `
                ✅ Produto ${data.id_lote_produto_custom} fabricado com sucesso!<br>
                <div class="qr-code-display">
                    <p><strong>Link de Rastreabilidade:</strong></p>
                    <a href="${data.link_qr_code}" target="_blank">${data.link_qr_code}</a>
                </div>
            `;
            mensagem.style.display = 'block';
            
            form.reset();
            
            setTimeout(() => {
                showTab('produtos');
            }, 3000);
            
        } catch (error) {
            console.error('Erro:', error);
            mensagem.className = 'message error';
            mensagem.textContent = `❌ ${error.message}`;
            mensagem.style.display = 'block';
        }
    });
});

// ===================================
// CARREGAR MEUS PRODUTOS
// ===================================

async function carregarMeusProdutos() {
    const token = localStorage.getItem('accessToken');
    const container = document.getElementById('produtosList');
    
    try {
        const response = await fetch(`${API_URL}/produtos_acabados/`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error('Erro ao carregar produtos');
        }
        
        const produtos = await response.json();
        
        if (produtos.length === 0) {
            container.innerHTML = '<p class="empty-state">Você ainda não fabricou nenhum produto.</p>';
            return;
        }
        
        container.innerHTML = produtos.map(produto => `
            <div class="lote-card">
                <h3>${produto.id_lote_produto_custom}</h3>
                <p><strong>Nome:</strong> ${produto.nome_produto}</p>
                <p><strong>SKU:</strong> ${produto.sku_produto}</p>
                <p><strong>Lote Serrado:</strong> ID ${produto.id_lote_serrado_origem}</p>
                <p><strong>Data Fabricação:</strong> ${formatarData(produto.data_fabricacao)}</p>
                ${produto.dados_acabamento ? `<p><strong>Acabamento:</strong> ${produto.dados_acabamento}</p>` : ''}
                <div class="qr-code-display" style="margin-top: 15px;">
                    <a href="${produto.link_qr_code}" target="_blank">🔗 Ver Rastreabilidade</a>
                </div>
            </div>
        `).join('');
        
    } catch (error) {
        console.error('Erro:', error);
        container.innerHTML = '<p class="empty-state">Erro ao carregar produtos.</p>';
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
carregarLotesSerrados();