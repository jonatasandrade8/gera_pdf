/* nota_script.js - Modificado para Tabela */

// Estado global da aplicação
let recebedorType = 'pf';
let pagadorType = 'pf';
let recebiveis = []; // Armazenará { descricao, valor }
let descontos = [];  // Armazenará { descricao, valor }
const LOCAL_STORAGE_KEY = 'notasReceber'; 

// Event listener para carregar dados salvos ao iniciar
document.addEventListener('DOMContentLoaded', () => {
    // 1. Inicialização de Datas
    const hoje = new Date().toISOString().split('T')[0];
    document.getElementById('periodo-inicio').value = hoje;
    document.getElementById('periodo-fim').value = hoje;
    
    // 2. Carregamento Inicial
    setRecebedorType('pf');
    setPagadorType('pf');
    renderizarItens('recebiveis');
    renderizarItens('descontos');
    calcularTotal();
    renderizarNotasSalvas();
    atualizarPrevia();
});

// --- FUNÇÕES DE CONTROLE DE TIPO (PF/PJ) ---
// (Funções setRecebedorType, setPagadorType permanecem as mesmas)
function setRecebedorType(tipo) {
    recebedorType = tipo;
    document.getElementById('btn-recebedor-pf').classList.toggle('active', tipo === 'pf');
    document.getElementById('btn-recebedor-pj').classList.toggle('active', tipo === 'pj');
    
    const labelNome = document.getElementById('label-recebedor-nome');
    const labelDoc = document.getElementById('label-recebedor-doc');
    const inputDoc = document.getElementById('recebedor-doc');
    const logoGroup = document.getElementById('logo-recebedor-group');

    if (tipo === 'pf') {
        labelNome.innerText = 'Nome Completo *';
        labelDoc.innerText = 'CPF *';
        inputDoc.placeholder = '000.000.000-00';
        logoGroup.style.display = 'none';
    } else {
        labelNome.innerText = 'Razão Social *';
        labelDoc.innerText = 'CNPJ *';
        inputDoc.placeholder = '00.000.000/0000-00';
        logoGroup.style.display = 'block';
    }
    inputDoc.value = '';
    atualizarPrevia();
}

function setPagadorType(tipo) {
    pagadorType = tipo;
    document.getElementById('btn-pagador-pf').classList.toggle('active', tipo === 'pf');
    document.getElementById('btn-pagador-pj').classList.toggle('active', tipo === 'pj');
    
    const labelNome = document.getElementById('label-pagador-nome');
    const labelDoc = document.getElementById('label-pagador-doc');
    const inputDoc = document.getElementById('pagador-doc');

    if (tipo === 'pf') {
        labelNome.innerText = 'Nome Completo';
        labelDoc.innerText = 'CPF';
        inputDoc.placeholder = '000.000.000-00';
    } else {
        labelNome.innerText = 'Razão Social';
        labelDoc.innerText = 'CNPJ';
        inputDoc.placeholder = '00.000.000/0000-00';
    }
    inputDoc.value = '';
    atualizarPrevia();
}

// --- LÓGICA DE LOGO BASE64 ---
// (Função processarLogo permanece a mesma)
function processarLogo() {
    const fileInput = document.getElementById('recebedor-logo');
    const base64Input = document.getElementById('recebedor-logo-base64');
    const statusText = document.getElementById('logo-status-text');
    const file = fileInput.files[0];

    if (!file) {
        base64Input.value = '';
        statusText.innerText = 'Nenhuma imagem selecionada.';
        atualizarPrevia();
        return;
    }

    if (file.size > 500 * 1024) { 
        alert('A imagem é muito grande. O tamanho máximo recomendado é 500KB.');
        fileInput.value = '';
        base64Input.value = '';
        statusText.innerText = 'Arquivo muito grande (Máx: 500KB).';
        atualizarPrevia();
        return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
        base64Input.value = e.target.result;
        statusText.innerText = `Logo carregada: ${file.name}`;
        atualizarPrevia();
    };
    reader.onerror = function(e) {
        console.error("Erro ao ler arquivo:", e);
        base64Input.value = '';
        statusText.innerText = 'Erro ao carregar a imagem.';
        atualizarPrevia();
    };
    reader.readAsDataURL(file);
}

// --- LÓGICA DE ITENS (RECEBÍVEIS / DESCONTOS) (Refatorada) ---

function adicionarItem(listaTipo) {
    const lista = listaTipo === 'recebiveis' ? recebiveis : descontos;
    // Adiciona um item VAZIO, conforme solicitado
    lista.push({ 
        descricao: '', 
        valor: 0.00 
    });
    renderizarItens(listaTipo);
    calcularTotal();
    atualizarPrevia();
}

function removerItem(listaTipo, index) {
    const lista = listaTipo === 'recebiveis' ? recebiveis : descontos;
    lista.splice(index, 1);
    renderizarItens(listaTipo);
    calcularTotal();
    atualizarPrevia();
}

function atualizarItem(listaTipo, index, campo, valor) {
    const lista = listaTipo === 'recebiveis' ? recebiveis : descontos;
    if (campo === 'valor') {
        const valorLimpo = valor.replace('R$ ', '').replace(/\./g, '').replace(',', '.'); 
        const valorNumerico = parseFloat(valorLimpo);
        lista[index][campo] = isNaN(valorNumerico) ? 0.00 : valorNumerico;
    } else {
        lista[index][campo] = valor;
    }
    calcularTotal();
    atualizarPrevia();
}

// Função de renderização modificada para usar <table>
function renderizarItens(listaTipo) {
    const lista = listaTipo === 'recebiveis' ? recebiveis : descontos;
    const tbody = document.getElementById(listaTipo + '-tbody');
    tbody.innerHTML = ''; // Limpa o corpo da tabela

    if (lista.length === 0) {
        tbody.innerHTML = `<tr><td colspan="3" style="text-align: center; color: #999; padding: 20px;">Nenhum ${listaTipo === 'recebiveis' ? 'recebível' : 'desconto'} adicionado.</td></tr>`;
        return;
    }

    lista.forEach((item, index) => {
        const tr = document.createElement('tr');
        tr.dataset.index = index;
        
        // Formata o valor para exibição (mostra vazio se for 0)
        const valorExibido = (item.valor === 0 || !item.valor) ? '' : item.valor.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, ".");

        tr.innerHTML = `
            <td>
                <input type="text" value="${item.descricao}" placeholder="Descrição do Item"
                       oninput="atualizarItem('${listaTipo}', ${index}, 'descricao', this.value)">
            </td>
            <td>
                <input type="text" value="${valorExibido}" placeholder="R$ 0,00"
                       oninput="formatarMoeda(this)" 
                       onblur="atualizarItem('${listaTipo}', ${index}, 'valor', this.value)">
            </td>
            <td>
                <button class="remove-btn" onclick="removerItem('${listaTipo}', ${index})">X</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// --- LÓGICA DE CÁLCULO E TOTALIZAÇÃO ---
// (Função calcularTotal permanece a mesma)
function calcularTotal() {
    const totalRecebiveis = recebiveis.reduce((sum, item) => sum + item.valor, 0);
    const totalDescontos = descontos.reduce((sum, item) => sum + item.valor, 0);
    const totalFinal = totalRecebiveis - totalDescontos;

    document.getElementById('total-recebiveis').innerText = formatarParaMoeda(totalRecebiveis);
    document.getElementById('total-descontos').innerText = formatarParaMoeda(totalDescontos);
    document.getElementById('total-final').innerText = formatarParaMoeda(totalFinal);
    
    return { totalRecebiveis, totalDescontos, totalFinal };
}

// --- FUNÇÕES AUXILIARES DE FORMATAÇÃO E BUSCA ---

function formatarParaMoeda(valor) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        minimumFractionDigits: 2
    }).format(valor);
}

// Formatador de moeda para o input
function formatarMoeda(input) {
    let value = input.value.replace(/\D/g, "");
    if (value.length === 0) {
        input.value = "";
        return;
    }
    value = (value / 100).toFixed(2);
    value = value.replace('.', ',').replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1.");
    input.value = "R$ " + value; // Adiciona R$
}

function formatarDocumento(input) {
    let value = input.value.replace(/\D/g, "");
    let type = (input.id.includes('recebedor')) ? recebedorType : pagadorType;

    if (type === 'pf') { // CPF
        value = value.replace(/(\d{3})(\d)/, "$1.$2")
                     .replace(/(\d{3})(\d)/, "$1.$2")
                     .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
        input.value = value.slice(0, 14);
    } else { // CNPJ
        value = value.replace(/^(\d{2})(\d)/, "$1.$2")
                     .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
                     .replace(/\.(\d{3})(\d)/, ".$1/$2")
                     .replace(/(\d{4})(\d)/, "$1-$2");
        input.value = value.slice(0, 18);
    }
}

function formatarTelefone(input) {
    let value = input.value.replace(/\D/g, "");
    value = value.replace(/^(\d{2})(\d)/g, "($1) $2");
    if (value.length > 9) { // 9º dígito
        value = value.replace(/(\d{5})(\d)/, "$1-$2");
    } else {
        value = value.replace(/(\d{4})(\d)/, "$1-$2");
    }
    input.value = value.slice(0, 15);
}

function formatarCEP(input) {
    let value = input.value.replace(/\D/g, "");
    value = value.replace(/^(\d{5})(\d)/, "$1-$2");
    input.value = value.slice(0, 9);
}

// (Funções buscarCEP e buscarCNPJ permanecem as mesmas - usando APIs)
async function buscarCEP(tipo) {
    const cep = document.getElementById(tipo + '-cep').value.replace(/\D/g, "");
    if (cep.length !== 8) return;
    
    const url = `https://viacep.com.br/ws/${cep}/json/`;
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('CEP não encontrado');
        const data = await response.json();
        
        if (data.erro) {
            alert('CEP não encontrado.');
            return;
        }

        document.getElementById(tipo + '-rua').value = data.logradouro || '';
        document.getElementById(tipo + '-cidade').value = data.localidade || '';
        document.getElementById(tipo + '-uf').value = data.uf || '';
        document.getElementById(tipo + '-num').focus();
        atualizarPrevia();

    } catch (error) {
        alert('Não foi possível buscar o CEP.');
    }
}

async function buscarCNPJ(tipo) {
    const docInput = document.getElementById(tipo + '-doc');
    const doc = docInput.value.replace(/\D/g, "");
    
    const isPJ = (tipo === 'recebedor' && recebedorType === 'pj') || (tipo === 'pagador' && pagadorType === 'pj');

    if (isPJ && doc.length === 14) {
        const url = `https://brasilapi.com.br/api/cnpj/v1/${doc}`;
        try {
            document.getElementById(tipo + '-nome').value = "Buscando...";
            const response = await fetch(url);
            if (!response.ok) throw new Error('CNPJ não encontrado');
            const data = await response.json();

            document.getElementById(tipo + '-nome').value = data.razao_social || '';
            document.getElementById(tipo + '-cep').value = data.cep ? data.cep.replace(/\D/g, '').replace(/^(\d{5})(\d)/, '$1-$2') : '';
            document.getElementById(tipo + '-rua').value = data.logradouro || '';
            document.getElementById(tipo + '-num').value = data.numero || '';
            document.getElementById(tipo + '-cidade').value = data.municipio || '';
            document.getElementById(tipo + '-uf').value = data.uf || '';
            document.getElementById(tipo + '-tel').value = data.ddd_telefone_1 || '';
            atualizarPrevia();
        } catch (error) {
            alert('Não foi possível buscar o CNPJ.');
            document.getElementById(tipo + '-nome').value = "";
        }
    }
}


// --- LÓGICA CRUD (LocalStorage) ---
// (Funções coletarDadosFormulario, salvarNota, carregarNota, deletarNota, renderizarNotasSalvas permanecem as mesmas)
function coletarDadosFormulario() {
    const dados = {
        recebedor: {
            nome: document.getElementById('recebedor-nome').value,
            doc: document.getElementById('recebedor-doc').value,
            tel: document.getElementById('recebedor-tel').value,
            rua: document.getElementById('recebedor-rua').value,
            num: document.getElementById('recebedor-num').value,
            cidade: document.getElementById('recebedor-cidade').value,
            uf: document.getElementById('recebedor-uf').value,
            tipo: recebedorType,
            logoBase64: recebedorType === 'pj' ? document.getElementById('recebedor-logo-base64').value : ''
        },
        pagador: {
            nome: document.getElementById('pagador-nome').value,
            doc: document.getElementById('pagador-doc').value,
            tel: document.getElementById('pagador-tel').value,
            rua: document.getElementById('pagador-rua').value,
            num: document.getElementById('pagador-num').value,
            cidade: document.getElementById('pagador-cidade').value,
            uf: document.getElementById('pagador-uf').value,
            tipo: pagadorType,
        },
        recebiveis: recebiveis,
        descontos: descontos,
        dataInicio: document.getElementById('periodo-inicio').value,
        dataFim: document.getElementById('periodo-fim').value,
        periodoTipo: document.getElementById('periodo-tipo').value,
        observacoes: document.getElementById('observacoes').value,
    };
    return dados;
}

function salvarNota() {
    const dadosAtuais = coletarDadosFormulario();
    if (!dadosAtuais.recebedor.nome) {
        alert("Preencha pelo menos o nome do Recebedor para salvar.");
        return;
    }

    let notasSalvas = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '[]');
    
    const novaNota = {
        id: Date.now(),
        nomeRecebedor: dadosAtuais.recebedor.nome,
        nomePagador: dadosAtuais.pagador.nome || 'Não informado',
        totalFinal: calcularTotal().totalFinal,
        dataCriacao: new Date().toLocaleDateString('pt-BR'),
        dados: dadosAtuais
    };

    notasSalvas.push(novaNota);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(notasSalvas));
    alert(`Nota salva com sucesso! Total: ${formatarParaMoeda(novaNota.totalFinal)}`);
    renderizarNotasSalvas();
}

function carregarNota(id) {
    const notasSalvas = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '[]');
    const nota = notasSalvas.find(n => n.id === id);
    if (!nota) return;

    const dados = nota.dados;

    setRecebedorType(dados.recebedor.tipo);
    setPagadorType(dados.pagador.tipo);

    // Preenche Recebedor
    document.getElementById('recebedor-nome').value = dados.recebedor.nome;
    document.getElementById('recebedor-doc').value = dados.recebedor.doc;
    document.getElementById('recebedor-tel').value = dados.recebedor.tel;
    document.getElementById('recebedor-rua').value = dados.recebedor.rua;
    document.getElementById('recebedor-num').value = dados.recebedor.num;
    document.getElementById('recebedor-cidade').value = dados.recebedor.cidade;
    document.getElementById('recebedor-uf').value = dados.recebedor.uf;
    document.getElementById('recebedor-logo-base64').value = dados.recebedor.logoBase64;
    document.getElementById('logo-status-text').innerText = dados.recebedor.logoBase64 ? 'Logo restaurada' : 'Nenhuma imagem.';

    // Preenche Pagador
    document.getElementById('pagador-nome').value = dados.pagador.nome;
    document.getElementById('pagador-doc').value = dados.pagador.doc;
    document.getElementById('pagador-tel').value = dados.pagador.tel;
    document.getElementById('pagador-rua').value = dados.pagador.rua;
    document.getElementById('pagador-num').value = dados.pagador.num;
    document.getElementById('pagador-cidade').value = dados.pagador.cidade;
    document.getElementById('pagador-uf').value = dados.pagador.uf;

    // Preenche Período/Observações
    document.getElementById('periodo-inicio').value = dados.dataInicio;
    document.getElementById('periodo-fim').value = dados.dataFim;
    document.getElementById('periodo-tipo').value = dados.periodoTipo;
    document.getElementById('observacoes').value = dados.observacoes;
    
    // Preenche Recebíveis e Descontos (Arrays globais)
    recebiveis = dados.recebiveis || [];
    descontos = dados.descontos || [];
    renderizarItens('recebiveis');
    renderizarItens('descontos');

    calcularTotal();
    atualizarPrevia();
    alert(`Nota de ${dados.recebedor.nome} carregada!`);
}

function deletarNota(id) {
    if (!confirm("Tem certeza que deseja deletar esta nota?")) return;
    
    let notasSalvas = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '[]');
    notasSalvas = notasSalvas.filter(n => n.id !== id);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(notasSalvas));
    renderizarNotasSalvas();
}

function renderizarNotasSalvas() {
    const listaContainer = document.getElementById('lista-notas-salvas');
    const notasSalvas = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '[]');
    
    listaContainer.innerHTML = '';

    if (notasSalvas.length === 0) {
        listaContainer.innerHTML = '<p style="color: #999; text-align: center; padding: 10px;">Nenhuma nota salva.</p>';
        return;
    }

    notasSalvas.forEach(nota => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'saved-item';
        itemDiv.innerHTML = `
            <span>
                ${nota.nomeRecebedor} para ${nota.nomePagador}
                <small style="display: block; color: #7f8c8d; font-weight: normal;">${nota.dataCriacao} | ${formatarParaMoeda(nota.totalFinal)}</small>
            </span>
            <div class="saved-item-actions">
                <button class="btn-load" onclick="carregarNota(${nota.id})">Carregar</button>
                <button class="btn-delete" onclick="deletarNota(${nota.id})">Deletar</button>
            </div>
        `;
        listaContainer.appendChild(itemDiv);
    });
}


// --- PRÉVIA DO DOCUMENTO (SIMPLIFICADA) ---
// (Função atualizarPrevia permanece a mesma)
function atualizarPrevia() {
    const { totalFinal } = calcularTotal();
    const recebedorNome = document.getElementById('recebedor-nome').value || 'Nome do Recebedor';
    const pagadorNome = document.getElementById('pagador-nome').value || 'Nome do Pagador (Cliente)';

    let previaHTML = `
        <h3 style="color:#2980b9; border-bottom: 2px solid #ddd; padding-bottom: 5px;">NOTA DE VALORES A RECEBER</h3>
        <p><strong>De:</strong> ${recebedorNome} (${recebedorType.toUpperCase()})</p>
        <p><strong>Para:</strong> ${pagadorNome} (${pagadorType.toUpperCase()})</p>
        <hr style="margin: 10px 0;">
        <p>Total de Recebíveis: ${formatarParaMoeda(recebiveis.reduce((sum, item) => sum + item.valor, 0))}</p>
        <p style="color: #e74c3c;">Total de Descontos: ${formatarParaMoeda(descontos.reduce((sum, item) => sum + item.valor, 0))}</p>
        <h4 style="margin-top: 10px; color: #27ae60;">Total Final: ${formatarParaMoeda(totalFinal)}</h4>
    `;
    
    const logoBase64 = document.getElementById('recebedor-logo-base64').value;

    if (recebedorType === 'pj' && logoBase64) {
        previaHTML = `<img src="${logoBase64}" alt="Logo" style="max-width: 100px; max-height: 100px; margin-bottom: 10px; display: block;">` + previaHTML;
    }

    document.getElementById('preview').innerHTML = previaHTML;
}

// --- GERAÇÃO DO PDF (PDFMake) ---
// (Função gerarPDF permanece a mesma, pois já lia dos arrays globais)
async function gerarPDF() {
    // 1. Coleta de Dados
    const dados = coletarDadosFormulario();

    // 2. Validação Mínima
    if (!dados.recebedor.nome || !dados.pagador.nome || dados.recebiveis.length === 0) {
        alert("Preencha o nome do Recebedor, do Pagador e adicione pelo menos 1 item a receber.");
        return;
    }

    const { totalRecebiveis, totalDescontos, totalFinal } = calcularTotal();

    const dataFormatada = new Date().toLocaleDateString('pt-BR');

    const getTabelaItens = (lista, titulo, cor) => {
        if (lista.length === 0) return [];
        
        const tableBody = [
            [{ text: titulo.toUpperCase(), style: 'tableHeader', colSpan: 2, alignment: 'left' }, {}, { text: 'VALOR (R$)', style: 'tableHeader', alignment: 'right' }],
        ];

        lista.forEach(item => {
            tableBody.push([
                { text: item.descricao, fontSize: 10 },
                { text: '', fontSize: 10 }, 
                { text: formatarParaMoeda(item.valor).replace('R$', '').trim(), alignment: 'right', fontSize: 10 }
            ]);
        });
        
        const subtotal = lista.reduce((sum, item) => sum + item.valor, 0);
        tableBody.push([
            { text: `SUBTOTAL ${titulo.toUpperCase()}`, style: 'tableSubtotal', colSpan: 2, alignment: 'right', fillColor: '#f2f2f2' },
            {},
            { text: formatarParaMoeda(subtotal).replace('R$', '').trim(), style: 'tableSubtotal', alignment: 'right', fillColor: '#f2f2f2', color: cor }
        ]);

        return [
            { text: '\n' },
            {
                table: {
                    headerRows: 1,
                    widths: ['*', 'auto', 80],
                    body: tableBody
                },
                layout: {
                    fillColor: function (rowIndex, node, columnIndex) {
                        return (rowIndex === 0) ? '#34495e' : null; 
                    },
                    hLineWidth: function (i, node) { return (i === 0 || i === tableBody.length) ? 1 : 0.5; },
                    vLineWidth: function (i, node) { return (i === 0 || i === node.table.widths.length) ? 1 : 0.5; },
                    hLineColor: function (i, node) { return (i === 0 || i === tableBody.length) ? '#999' : '#eee'; },
                    vLineColor: function (i, node) { return (i === 0 || i === node.table.widths.length) ? '#999' : '#eee'; }
                }
            }
        ];
    };
    
    const corpoRecebiveis = getTabelaItens(dados.recebiveis, 'Recebíveis', '#27ae60');
    const corpoDescontos = getTabelaItens(dados.descontos, 'Descontos', '#e74c3c');

    // 3. Estrutura do Documento (PDFMake)
    const docDefinition = {
        pageSize: 'A4',
        pageMargins: [40, 40, 40, 40],
        content: [
            {
                columns: [
                    dados.recebedor.tipo === 'pj' && dados.recebedor.logoBase64 ? 
                    { image: dados.recebedor.logoBase64, width: 80, height: 80, alignment: 'left' } :
                    { text: 'NOTA DE VALORES A RECEBER', style: 'header', alignment: 'left' },
                    
                    { 
                        text: [
                            { text: dados.recebedor.nome + '\n', bold: true, fontSize: 12 },
                            { text: dados.recebedor.rua + ', ' + dados.recebedor.num + '\n', fontSize: 10 },
                            { text: `${dados.recebedor.cidade} - ${dados.recebedor.uf} | Doc: ${dados.recebedor.doc}\n`, fontSize: 10 },
                            { text: 'Tel: ' + dados.recebedor.tel, fontSize: 10 },
                        ],
                        alignment: 'right'
                    }
                ],
                margin: [0, 0, 0, 20]
            },
            { text: `NOTA DE VALORES A RECEBER EMITIDA EM ${dataFormatada}`, style: 'subheader', alignment: 'center', margin: [0, 10, 0, 10] },
            {
                table: {
                    widths: ['auto', '*'],
                    body: [
                        [{ text: 'PAGADOR (CLIENTE)', style: 'infoBoxHeader', fillColor: '#ecf0f1' }, { text: dados.pagador.nome, style: 'infoBox' }],
                        [{ text: dados.pagador.tipo.toUpperCase(), style: 'infoBoxHeader', fillColor: '#ecf0f1' }, { text: dados.pagador.doc, style: 'infoBox' }],
                        [{ text: 'ENDEREÇO', style: 'infoBoxHeader', fillColor: '#ecf0f1' }, { text: `${dados.pagador.rua}, ${dados.pagador.num} - ${dados.pagador.cidade}/${dados.pagador.uf}`, style: 'infoBox' }]
                    ]
                },
                layout: 'lightHorizontalLines',
                margin: [0, 5, 0, 15]
            },
            ...corpoRecebiveis,
            ...corpoDescontos,
            {
                columns: [
                    { text: `Data de Início: ${new Date(dados.dataInicio).toLocaleDateString()}\nData de Término: ${new Date(dados.dataFim).toLocaleDateString()} (${dados.periodoTipo})`, style: 'infoBox', width: '*' },
                    {
                        table: {
                            widths: ['*', 100],
                            body: [
                                [{ text: 'TOTAL RECEBÍVEIS', style: 'totalLabel' }, { text: formatarParaMoeda(totalRecebiveis), style: 'totalAmount', color: '#27ae60' }],
                                [{ text: 'TOTAL DESCONTOS', style: 'totalLabel' }, { text: formatarParaMoeda(totalDescontos), style: 'totalAmount', color: '#e74c3c' }],
                                [{ text: 'TOTAL LÍQUIDO', style: 'totalFinalLabel', fillColor: '#d1e7dd' }, { text: formatarParaMoeda(totalFinal), style: 'totalFinalAmount', fillColor: '#d1e7dd' }],
                            ]
                        },
                        layout: 'noBorders',
                        width: 'auto',
                        margin: [0, 10, 0, 10]
                    }
                ],
                margin: [0, 10, 0, 20]
            },
            dados.observacoes ? { text: [{ text: 'Observações:\n', bold: true }, dados.observacoes], style: 'paragraph', margin: [0, 10, 0, 10] } : null,
            {
                columns: [
                    { text: '___________________________________\n' + dados.recebedor.nome, alignment: 'center', style: 'assinaturaNome' },
                    { text: '___________________________________\n' + dados.pagador.nome, alignment: 'center', style: 'assinaturaNome' }
                ],
                margin: [0, 50, 0, 0]
            },
            { text: 'Esta nota foi gerada eletronicamente.', style: 'footer', alignment: 'center', margin: [0, 30, 0, 0] }
        ].filter(Boolean),
        styles: {
            header: { fontSize: 18, bold: true, color: '#2c3e50' },
            subheader: { fontSize: 14, bold: true, color: '#34495e', margin: [0, 10, 0, 5] },
            infoBox: { fontSize: 10, lineHeight: 1.3 },
            infoBoxHeader: { fontSize: 10, bold: true, color: '#555', padding: [5, 2] },
            tableHeader: { bold: true, fontSize: 10, color: '#FFFFFF', fillColor: '#34495e', alignment: 'left', padding: [5, 2] },
            tableSubtotal: { bold: true, fontSize: 10, alignment: 'right', padding: [5, 2] },
            totalLabel: { fontSize: 10, bold: true, alignment: 'right' },
            totalAmount: { fontSize: 12, bold: true, alignment: 'right' },
            totalFinalLabel: { fontSize: 14, bold: true, alignment: 'right', color: '#2c3e50' },
            totalFinalAmount: { fontSize: 16, bold: true, alignment: 'right', color: '#27ae60' },
            paragraph: { fontSize: 11, lineHeight: 1.4 },
            assinaturaNome: { fontSize: 10, color: '#555', margin: [0, 5, 0, 0] },
            footer: { fontSize: 8, color: '#999' }
        },
        defaultStyle: { font: 'Roboto' }
    };

    // 4. Gerar o PDF
    pdfMake.createPdf(docDefinition).download(`Nota_Valores_a_Receber_${dados.pagador.nome.split(' ')[0]}_${dataFormatada.replace(/\//g, '-')}.pdf`);
}