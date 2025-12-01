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
    } else if (tabName === 'rastrear') {
        // Limpar resultado anterior
        document.getElementById('resultadoRastreabilidade').innerHTML = '';
        document.getElementById('produtoIdRastrear').value = '';
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
                    <a href="https://app-rastreabilidade.onrender.com/rastrear.html?id=${produto.id_lote_produto_custom}" target="_blank">🔗 Ver Rastreabilidade</a>
                </div>
            </div>
        `).join('');
        
    } catch (error) {
        console.error('Erro:', error);
        container.innerHTML = '<p class="empty-state">Erro ao carregar produtos.</p>';
    }
}

// ===================================
// RASTREABILIDADE
// ===================================

async function buscarRastreabilidade() {
    const produtoId = document.getElementById('produtoIdRastrear').value.trim().toUpperCase();
    const container = document.getElementById('resultadoRastreabilidade');
    
    if (!produtoId) {
        container.innerHTML = '<p class="message error" style="display: block;">Por favor, digite o ID do produto.</p>';
        return;
    }
    
    container.innerHTML = '<p class="loading">Buscando rastreabilidade...</p>';
    
    try {
        const response = await fetch(`${API_URL}/rastrear/${produtoId}`);
        
        if (!response.ok) {
            throw new Error('Produto não encontrado');
        }
        
        const dados = await response.json();
        renderizarRastreabilidade(dados);
        
    } catch (error) {
        console.error('Erro:', error);
        container.innerHTML = `
            <div class="message error" style="display: block;">
                ❌ ${error.message}
            </div>
        `;
    }
}

function renderizarRastreabilidade(dados) {
    const container = document.getElementById('resultadoRastreabilidade');
    
    let html = '<div class="timeline">';
    
    // Produto Acabado
    html += `
        <div class="timeline-item produto">
            <div class="stage-title">
                <span class="stage-icon">📦</span>
                <div>
                    <h3>Produto Acabado</h3>
                    <span class="badge badge-purple">Etapa Final</span>
                </div>
            </div>
            <div class="info-row">
                <div class="info-box">
                    <div class="info-label">ID do Produto</div>
                    <div class="info-value">${dados.produto.id_custom}</div>
                </div>
                <div class="info-box">
                    <div class="info-label">Nome</div>
                    <div class="info-value">${dados.produto.nome}</div>
                </div>
                <div class="info-box">
                    <div class="info-label">SKU</div>
                    <div class="info-value">${dados.produto.sku}</div>
                </div>
                <div class="info-box">
                    <div class="info-label">Data Fabricação</div>
                    <div class="info-value">${formatarData(dados.produto.data_fabricacao)}</div>
                </div>
            </div>
            ${dados.produto.dados_acabamento ? `
                <div class="info-box" style="margin-top: 15px;">
                    <div class="info-label">Acabamento</div>
                    <div class="info-value">${dados.produto.dados_acabamento}</div>
                </div>
            ` : ''}
        </div>
    `;
    
    // Lote Serrado
    if (dados.lote_serrado) {
        html += `
            <div class="timeline-item serrado">
                <div class="stage-title">
                    <span class="stage-icon">🪚</span>
                    <div>
                        <h3>Processamento na Serraria</h3>
                        <span class="badge badge-orange">Etapa 2</span>
                    </div>
                </div>
                <div class="info-row">
                    <div class="info-box">
                        <div class="info-label">ID Lote Serrado</div>
                        <div class="info-value">${dados.lote_serrado.id_custom}</div>
                    </div>
                    <div class="info-box">
                        <div class="info-label">Tipo</div>
                        <div class="info-value">${dados.lote_serrado.tipo_produto || 'N/A'}</div>
                    </div>
                    <div class="info-box">
                        <div class="info-label">Dimensões</div>
                        <div class="info-value">${dados.lote_serrado.dimensoes || 'N/A'}</div>
                    </div>
                    <div class="info-box">
                        <div class="info-label">Volume</div>
                        <div class="info-value">${dados.lote_serrado.volume_m3} m³</div>
                    </div>
                    <div class="info-box">
                        <div class="info-label">Data Processamento</div>
                        <div class="info-value">${formatarData(dados.lote_serrado.data_processamento)}</div>
                    </div>
                </div>
            </div>
        `;
    }
    
    // Lote de Tora
    if (dados.lote_tora) {
        html += `
            <div class="timeline-item tora">
                <div class="stage-title">
                    <span class="stage-icon">🌲</span>
                    <div>
                        <h3>Extração da Madeira</h3>
                        <span class="badge badge-green">Etapa 1 - Origem</span>
                    </div>
                </div>
                <div class="info-row">
                    <div class="info-box">
                        <div class="info-label">ID Lote Tora</div>
                        <div class="info-value">${dados.lote_tora.id_custom}</div>
                    </div>
                    <div class="info-box">
                        <div class="info-label">Espécie</div>
                        <div class="info-value">${dados.lote_tora.especie_popular || 'N/A'}</div>
                    </div>
                    ${dados.lote_tora.especie_cientifica ? `
                        <div class="info-box">
                            <div class="info-label">Nome Científico</div>
                            <div class="info-value"><em>${dados.lote_tora.especie_cientifica}</em></div>
                        </div>
                    ` : ''}
                    <div class="info-box">
                        <div class="info-label">Volume Original</div>
                        <div class="info-value">${dados.lote_tora.volume_m3} m³</div>
                    </div>
                    <div class="info-box">
                        <div class="info-label">DOF</div>
                        <div class="info-value">${dados.lote_tora.numero_dof}</div>
                    </div>
                    <div class="info-box">
                        <div class="info-label">Licença Ambiental</div>
                        <div class="info-value">${dados.lote_tora.numero_licenca}</div>
                    </div>
                    <div class="info-box">
                        <div class="info-label">Data Extração</div>
                        <div class="info-value">${formatarData(dados.lote_tora.data_registro)}</div>
                    </div>
                </div>
                <a href="https://www.google.com/maps?q=${dados.lote_tora.coordenadas.lat},${dados.lote_tora.coordenadas.lon}" 
                   target="_blank" 
                   class="map-link">
                    📍 Ver Localização no Mapa
                </a>
            </div>
        `;
    }
    
    html += '</div>';
    container.innerHTML = html;
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