// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * RastreabilidadeMadeira
 * Smart Contract para rastreabilidade completa da cadeia de madeira
 * Este contrato registra toda a jornada: Tora -> Serrado -> Produto Acabado
 */
contract RastreabilidadeMadeira {
    
    // ===================================
    // ESTRUTURAS DE DADOS
    // ===================================
    
    struct LoteTora {
        string idLoteCustom;
        uint256 timestamp;
        string coordenadasGPS; // Formato: "lat,lon"
        string numeroDOF;
        string numeroLicencaAmbiental;
        string especieMadeira;
        uint256 volumeM3; // Multiplicado por 100 para evitar decimais (150.75 = 15075)
        address tecnicoResponsavel;
        bool existe;
    }
    
    struct LoteSerrado {
        string idLoteSerradoCustom;
        string idLoteToraOrigem;
        uint256 timestamp;
        uint256 volumeSaidaM3; // Multiplicado por 100
        string tipoProduto;
        string dimensoes;
        address serrariaResponsavel;
        bool existe;
    }
    
    struct ProdutoAcabado {
        string idProdutoCustom;
        string idLoteSerradoOrigem;
        uint256 timestamp;
        string skuProduto;
        string nomeProduto;
        address fabricaResponsavel;
        bool existe;
    }
    
    // ===================================
    // ARMAZENAMENTO
    // ===================================
    
    // Mapeamentos principais
    mapping(string => LoteTora) public lotesTora;
    mapping(string => LoteSerrado) public lotesSerrado;
    mapping(string => ProdutoAcabado) public produtosAcabados;
    
    // Arrays para listagem
    string[] public idsLotesTora;
    string[] public idsLotesSerrado;
    string[] public idsProdutosAcabados;
    
    // Controle de acesso
    address public owner;
    
    // ===================================
    // EVENTOS
    // ===================================
    
    event LoteToraRegistrado(
        string indexed idLoteCustom,
        string especieMadeira,
        uint256 volumeM3,
        address tecnicoResponsavel,
        uint256 timestamp
    );
    
    event LoteSerradoRegistrado(
        string indexed idLoteSerradoCustom,
        string idLoteToraOrigem,
        uint256 volumeSaidaM3,
        address serrariaResponsavel,
        uint256 timestamp
    );
    
    event ProdutoAcabadoRegistrado(
        string indexed idProdutoCustom,
        string idLoteSerradoOrigem,
        string nomeProduto,
        address fabricaResponsavel,
        uint256 timestamp
    );
    
    // ===================================
    // CONSTRUCTOR
    // ===================================
    
    constructor() {
        owner = msg.sender;
    }
    
    // ===================================
    // FUNÇÕES PRINCIPAIS
    // ===================================
    
    /**
     * Registra um novo lote de tora na blockchain
     */
    function registrarLoteTora(
        string memory _idLoteCustom,
        string memory _coordenadasGPS,
        string memory _numeroDOF,
        string memory _numeroLicencaAmbiental,
        string memory _especieMadeira,
        uint256 _volumeM3
    ) public {
        require(!lotesTora[_idLoteCustom].existe, "Lote de tora ja existe");
        
        lotesTora[_idLoteCustom] = LoteTora({
            idLoteCustom: _idLoteCustom,
            timestamp: block.timestamp,
            coordenadasGPS: _coordenadasGPS,
            numeroDOF: _numeroDOF,
            numeroLicencaAmbiental: _numeroLicencaAmbiental,
            especieMadeira: _especieMadeira,
            volumeM3: _volumeM3,
            tecnicoResponsavel: msg.sender,
            existe: true
        });
        
        idsLotesTora.push(_idLoteCustom);
        
        emit LoteToraRegistrado(
            _idLoteCustom,
            _especieMadeira,
            _volumeM3,
            msg.sender,
            block.timestamp
        );
    }
    
    /**
     * Registra um lote serrado proveniente de um lote de tora
     */
    function registrarLoteSerrado(
        string memory _idLoteSerradoCustom,
        string memory _idLoteToraOrigem,
        uint256 _volumeSaidaM3,
        string memory _tipoProduto,
        string memory _dimensoes
    ) public {
        require(!lotesSerrado[_idLoteSerradoCustom].existe, "Lote serrado ja existe");
        require(lotesTora[_idLoteToraOrigem].existe, "Lote de tora origem nao existe");
        
        lotesSerrado[_idLoteSerradoCustom] = LoteSerrado({
            idLoteSerradoCustom: _idLoteSerradoCustom,
            idLoteToraOrigem: _idLoteToraOrigem,
            timestamp: block.timestamp,
            volumeSaidaM3: _volumeSaidaM3,
            tipoProduto: _tipoProduto,
            dimensoes: _dimensoes,
            serrariaResponsavel: msg.sender,
            existe: true
        });
        
        idsLotesSerrado.push(_idLoteSerradoCustom);
        
        emit LoteSerradoRegistrado(
            _idLoteSerradoCustom,
            _idLoteToraOrigem,
            _volumeSaidaM3,
            msg.sender,
            block.timestamp
        );
    }
    
    /**
     * Registra um produto acabado proveniente de um lote serrado
     */
    function registrarProdutoAcabado(
        string memory _idProdutoCustom,
        string memory _idLoteSerradoOrigem,
        string memory _skuProduto,
        string memory _nomeProduto
    ) public {
        require(!produtosAcabados[_idProdutoCustom].existe, "Produto ja existe");
        require(lotesSerrado[_idLoteSerradoOrigem].existe, "Lote serrado origem nao existe");
        
        produtosAcabados[_idProdutoCustom] = ProdutoAcabado({
            idProdutoCustom: _idProdutoCustom,
            idLoteSerradoOrigem: _idLoteSerradoOrigem,
            timestamp: block.timestamp,
            skuProduto: _skuProduto,
            nomeProduto: _nomeProduto,
            fabricaResponsavel: msg.sender,
            existe: true
        });
        
        idsProdutosAcabados.push(_idProdutoCustom);
        
        emit ProdutoAcabadoRegistrado(
            _idProdutoCustom,
            _idLoteSerradoOrigem,
            _nomeProduto,
            msg.sender,
            block.timestamp
        );
    }
    
    // ===================================
    // FUNÇÕES DE CONSULTA
    // ===================================
    
    /**
     * Retorna rastreabilidade completa de um produto
     */
    function obterRastreabilidadeCompleta(string memory _idProduto) 
        public 
        view 
        returns (
            ProdutoAcabado memory produto,
            LoteSerrado memory serrado,
            LoteTora memory tora
        ) 
    {
        require(produtosAcabados[_idProduto].existe, "Produto nao existe");
        
        produto = produtosAcabados[_idProduto];
        serrado = lotesSerrado[produto.idLoteSerradoOrigem];
        tora = lotesTora[serrado.idLoteToraOrigem];
        
        return (produto, serrado, tora);
    }
    
    /**
     * Verifica se um lote de tora existe
     */
    function lotesToraExiste(string memory _idLote) public view returns (bool) {
        return lotesTora[_idLote].existe;
    }
    
    /**
     * Verifica se um lote serrado existe
     */
    function loteSerradoExiste(string memory _idLote) public view returns (bool) {
        return lotesSerrado[_idLote].existe;
    }
    
    /**
     * Verifica se um produto existe
     */
    function produtoExiste(string memory _idProduto) public view returns (bool) {
        return produtosAcabados[_idProduto].existe;
    }
    
    /**
     * Retorna total de lotes de tora registrados
     */
    function getTotalLotesTora() public view returns (uint256) {
        return idsLotesTora.length;
    }
    
    /**
     * Retorna total de lotes serrados registrados
     */
    function getTotalLotesSerrado() public view returns (uint256) {
        return idsLotesSerrado.length;
    }
    
    /**
     * Retorna total de produtos acabados registrados
     */
    function getTotalProdutosAcabados() public view returns (uint256) {
        return idsProdutosAcabados.length;
    }
}
