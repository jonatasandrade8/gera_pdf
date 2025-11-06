let servicos = [];
let recebedorType = 'pf';
let pagadorType = 'pf';
let recibosSalvos = [];

// --- Funções de Formatação de Inputs (UX) ---
function formatarCEP(input) {
    let valor = input.value.replace(/\D/g, '');
    if (valor.length > 5) {
        valor = valor.replace(/^(\d{5})(\d)/, '$1-$2');
    }
    input.value = valor;
}

function formatarTelefone(input) {
    let valor = input.value.replace(/\D/g, '');
    let formatado = '';
    if (valor.length > 0) {
        formatado = '(' + valor.substring(0, 2);
    }
    if (valor.length > 2) {
        formatado += ') ' + valor.substring(2, 7);
    }
    if (valor.length > 7) {
        formatado += '-' + valor.substring(7, 11);
    }
    input.value = formatado;
}

function formatarDocumento(input) {
    let tipo = input.id.includes('recebedor') ? recebedorType : pagadorType;
    let valor = input.value.replace(/\D/g, '');

    if (tipo === 'pf') { // CPF
        input.maxLength = 14;
        valor = valor.substring(0, 11);
        if (valor.length > 9) {
            valor = valor.replace(/^(\d{3})(\d{3})(\d{3})(\d)/, '$1.$2.$3-$4');
        } else if (valor.length > 6) {
            valor = valor.replace(/^(\d{3})(\d{3})(\d)/, '$1.$2.$3');
        } else if (valor.length > 3) {
            valor = valor.replace(/^(\d{3})(\d)/, '$1.$2');
        }
    } else { // CNPJ
        input.maxLength = 18;
        valor = valor.substring(0, 14);
        if (valor.length > 12) {
            valor = valor.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d)/, '$1.$2.$3/$4-$5');
        } else if (valor.length > 8) {
            valor = valor.replace(/^(\d{2})(\d{3})(\d{3})(\d)/, '$1.$2.$3/$4');
        } else if (valor.length > 5) {
            valor = valor.replace(/^(\d{2})(\d{3})(\d)/, '$1.$2.$3');
        } else if (valor.length > 2) {
            valor = valor.replace(/^(\d{2})(\d)/, '$1.$2');
        }
    }
    input.value = valor;
}

// --- Funções de Gerenciamento de Tipo (PF/PJ) ---
function setRecebedorType(type) {
    recebedorType = type;
    document.getElementById('btn-recebedor-pf').classList.toggle('active', type === 'pf');
    document.getElementById('btn-recebedor-pj').classList.toggle('active', type === 'pj');
    const labelNome = document.getElementById('label-recebedor-nome');
    const labelDoc = document.getElementById('label-recebedor-doc');
    const inputDoc = document.getElementById('recebedor-doc');
    
    if (type === 'pf') {
        labelNome.textContent = 'Nome Completo *';
        labelDoc.textContent = 'CPF *';
        inputDoc.placeholder = '000.000.000-00';
    } else {
        labelNome.textContent = 'Razão Social *';
        labelDoc.textContent = 'CNPJ *';
        inputDoc.placeholder = '00.000.000/0000-00';
    }
    formatarDocumento(inputDoc);
    atualizarPrevia();
}

function setPagadorType(type) {
    pagadorType = type;
    document.getElementById('btn-pagador-pf').classList.toggle('active', type === 'pf');
    document.getElementById('btn-pagador-pj').classList.toggle('active', type === 'pj');
    const labelNome = document.getElementById('label-pagador-nome');
    const labelDoc = document.getElementById('label-pagador-doc');
    const inputDoc = document.getElementById('pagador-doc');

    if (type === 'pf') {
        labelNome.textContent = 'Nome Completo';
        labelDoc.textContent = 'CPF';
        inputDoc.placeholder = '000.000.000-00';
    } else {
        labelNome.textContent = 'Razão Social';
        labelDoc.textContent = 'CNPJ';
        inputDoc.placeholder = '00.000.000/0000-00';
    }
    formatarDocumento(inputDoc);
    atualizarPrevia();
}

// --- Funções de Busca (API) ---
function buscarCEP(tipo) {
    const cepInput = document.getElementById(tipo + '-cep');
    const cep = cepInput.value.replace(/\D/g, '');
    if (cep.length !== 8) return;

    fetch(`https://viacep.com.br/ws/${cep}/json/`)
        .then(res => res.json())
        .then(data => {
            if (!data.erro) {
                document.getElementById(tipo + '-rua').value = data.logradouro;
                document.getElementById(tipo + '-cidade').value = data.localidade;
                document.getElementById(tipo + '-uf').value = data.uf;
                document.getElementById(tipo + '-num').focus();
                atualizarPrevia();
            } else {
                console.warn('CEP não encontrado!');
            }
        })
        .catch(err => {
            console.error('Erro ao buscar CEP:', err);
        });
}

function buscarCNPJ(tipo) {
    const currentType = (tipo === 'recebedor') ? recebedorType : pagadorType;
    if (currentType !== 'pj') return;

    const cnpjInput = document.getElementById(tipo + '-doc');
    const cnpj = cnpjInput.value.replace(/\D/g, '');
    if (cnpj.length !== 14) return;

    fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpj}`)
        .then(res => {
            if (!res.ok) throw new Error('CNPJ não encontrado ou API indisponível');
            return res.json();
        })
        .then(data => {
            const getField = (id) => document.getElementById(tipo + id);
            getField('-nome').value = data.razao_social || '';
            getField('-rua').value = data.logradouro || '';
            getField('-num').value = data.numero || '';
            getField('-comp').value = data.complemento || '';
            
            const cepValue = data.cep ? data.cep.replace(/^(\d{5})(\d{3})$/, '$1-$2') : '';
            getField('-cep').value = cepValue;
            
            getField('-cidade').value = data.municipio || '';
            getField('-uf').value = data.uf || '';
            
            const telefoneValue = data.ddd_telefone_1 ? `(${data.ddd_telefone_1.substring(0, 2)}) ${data.ddd_telefone_1.substring(2)}` : '';
            getField('-tel').value = telefoneValue;
            
            atualizarPrevia();
        })
        .catch(err => {
            console.error('Erro ao buscar CNPJ:', err.message);
        });
}

// --- Funções de Gerenciamento de Serviços (Item do Recibo) ---
function adicionarServico() {
    const id = Date.now();
    servicos.push({ id, descricao: '', quantidade: 1, preco: 0 });
    renderizarServicos();
    atualizarPrevia(); 
}

function removerServico(id) {
    servicos = servicos.filter(s => s.id !== id);
    renderizarServicos();
    atualizarPrevia(); 
}

function atualizarServico(id, campo, valor) {
    const servico = servicos.find(s => s.id === id);
    if (servico) {
        if (campo === 'quantidade' || campo === 'preco') {
            servico[campo] = parseFloat(valor) || 0;
        } else {
            servico[campo] = valor;
        }
        atualizarPrevia(); 
    }
}

function renderizarServicos() {
    const lista = document.getElementById('services-list');
    if (servicos.length === 0) {
        lista.innerHTML = '<p style="color: #999; text-align: center; padding: 20px;">Nenhum produto/serviço adicionado</p>';
        calcularTotal(); 
        return;
    }

    lista.innerHTML = servicos.map(s => `
        <div class="service-item">
            <div class="service-field">
                <label>Descrição:</label>
                <input type="text" placeholder="Ex: Consultoria, Desenvolvimento, Aluguel..." value="${s.descricao}" oninput="atualizarServico(${s.id}, 'descricao', this.value)">
            </div>
            <div class="service-row">
                <div class="service-field">
                    <label>Quantidade:</label>
                    <input type="number" min="0" step="0.01" placeholder="1" value="${s.quantidade}" oninput="atualizarServico(${s.id}, 'quantidade', this.value)">
                </div>
                <div class="service-field">
                    <label>Preço UNIT (R$):</label>
                    <input type="number" min="0" step="0.01" placeholder="0.00" value="${s.preco}" oninput="atualizarServico(${s.id}, 'preco', this.value)">
                </div>
                <div class="service-field">
                    <label>&nbsp;</label>
                    <button class="btn-remove-service" onclick="removerServico(${s.id})">✕ Remover</button>
                </div>
            </div>
        </div>
    `).join('');
    
    calcularTotal(); 
}

// --- Funções de Cálculo e Formatação ---
function calcularTotal() {
    const total = servicos.reduce((sum, s) => sum + (s.quantidade * s.preco), 0);
    document.getElementById('total-amount').textContent = formatarMoeda(total);
    return total;
}

function formatarMoeda(valor) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor || 0);
}

// --- Funções de Atualização da UI (Preview) ---
function atualizarPrevia() {
    const total = calcularTotal();

    const getField = (id) => document.getElementById(id).value;

    const formatarEnderecoPreview = (tipo) => {
        const rua = getField(tipo + '-rua');
        const num = getField(tipo + '-num');
        const comp = getField(tipo + '-comp');
        const cidade = getField(tipo + '-cidade');
        const uf = getField(tipo + '-uf');
        const cep = getField(tipo + '-cep');

        return [
            rua && num ? `${rua}, ${num}` : rua,
            comp,
            cidade && uf ? `${cidade}/${uf}` : cidade,
            cep
        ].filter(Boolean).join(', ');
    };

    const recebedorEnd = formatarEnderecoPreview('recebedor');
    const pagadorEnd = formatarEnderecoPreview('pagador');

    const periodoTipo = document.getElementById('periodo-tipo').options[document.getElementById('periodo-tipo').selectedIndex].text;
    const dataInicio = getField('periodo-inicio');
    const dataFim = getField('periodo-fim');
    let textoPeriodo = '';
    if (dataInicio && dataFim) {
        const formatarData = (data) => new Date(data + 'T03:00:00').toLocaleDateString('pt-BR');
        textoPeriodo = `${periodoTipo} de ${formatarData(dataInicio)} a ${formatarData(dataFim)}`;
    }

    let html = `
        <style>
            .preview-header { text-align: center; border-bottom: 2px solid #3498db; padding-bottom: 15px; margin-bottom: 20px; }
            .preview-title { font-size: 24px; font-weight: bold; color: #2c3e50;}
            .preview-section { margin-bottom: 20px; }
            .preview-section h3 { background: #ecf0f1; padding: 8px; margin-bottom: 10px; border-radius: 2px; font-size: 14px; color: #34495e; border-left: 4px solid #3498db; font-weight: 600;}
            .preview-row { display: flex; margin-bottom: 5px; font-size: 14px; }
            .preview-label { font-weight: bold; width: 120px; color: #34495e; }
            .preview-value { flex-grow: 1; color: #555; }
            .services-table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            .services-table th, .services-table td { padding: 8px; border: 1px solid #ddd; text-align: left; }
            .services-table th { background-color: #3498db; color: white; font-size: 13px; }
        </style>

        <div class="preview-header">
            <div class="preview-title">RECIBO DE PAGAMENTO</div>
            <div style="font-size: 16px; color: #7f8c8d; margin-top: 5px;">VALOR: ${formatarMoeda(total)}</div>
        </div>

        <div class="preview-section">
            <h3>RECEBEDOR (Prestador de Serviço)</h3>
            <div class="preview-content">
                <div class="preview-row">
                    <div class="preview-label">${recebedorType === 'pf' ? 'Nome' : 'Razão Social'}:</div>
                    <div class="preview-value">${getField('recebedor-nome') || '—'}</div>
                </div>
                <div class="preview-row">
                    <div class="preview-label">${recebedorType === 'pf' ? 'CPF' : 'CNPJ'}:</div>
                    <div class="preview-value">${getField('recebedor-doc') || '—'}</div>
                </div>
                ${recebedorEnd ? `<div class="preview-row"><div class="preview-label">Endereço:</div><div class="preview-value">${recebedorEnd}</div></div>` : ''}
                <div class="preview-row">
                    <div class="preview-label">Telefone:</div>
                    <div class="preview-value">${getField('recebedor-tel') || '—'}</div>
                </div>
            </div>
        </div>

        <div class="preview-section">
            <h3>PAGADOR (Cliente)</h3>
            <div class="preview-content">
                <div class="preview-row">
                    <div class="preview-label">${pagadorType === 'pf' ? 'Nome' : 'Razão Social'}:</div>
                    <div class="preview-value">${getField('pagador-nome') || '—'}</div>
                </div>
                ${getField('pagador-doc') ? `
                    <div class="preview-row">
                        <div class="preview-label">${pagadorType === 'pf' ? 'CPF' : 'CNPJ'}:</div>
                        <div class="preview-value">${getField('pagador-doc')}</div>
                    </div>
                ` : ''}
                ${pagadorEnd ? `<div class="preview-row"><div class="preview-label">Endereço:</div><div class="preview-value">${pagadorEnd}</div></div>` : ''}
            </div>
        </div>

        <div class="preview-section">
            <h3>PERÍODO DA PRESTAÇÃO</h3>
            <div class="preview-content">
                <div class="preview-row">
                    <div class="preview-label">Referente a:</div>
                    <div class="preview-value">${textoPeriodo || '—'}</div>
                </div>
            </div>
        </div>


        ${servicos.length > 0 ? `
            <div class="preview-section">
                <h3>DISCRIMINAÇÃO DOS SERVIÇOS/PRODUTOS</h3>
                <table class="services-table">
                    <thead>
                        <tr>
                            <th style="width: 50%;">Descrição</th>
                            <th style="text-align: center; width: 10%;">Qtd</th>
                            <th style="text-align: right; width: 20%;">Preço Unit.</th>
                            <th style="text-align: right; width: 20%;">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${servicos.map(s => `
                            <tr>
                                <td>${s.descricao || 'N/D'}</td>
                                <td style="text-align: center;">${s.quantidade}</td>
                                <td style="text-align: right;">${formatarMoeda(s.preco)}</td>
                            <td style="text-align: right; font-weight: bold;">${formatarMoeda(s.quantidade * s.preco)}</td>
                            </tr>
                        `).join('')}
                        <tr style="background: #ecf0f1;">
                            <td style="font-weight: bold; color: #2c3e50; text-align: right;" colspan="3">TOTAL FINAL</td>
                            <td style="text-align: right; font-weight: bold; color: #3498db;">${formatarMoeda(total)}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        ` : ''}
        
        <div style="margin-top: 70px; text-align: center; font-size: 14px;">
            <div style="display: flex; justify-content: space-around;">
                <div style="width: 40%; text-align: center;">
                    <div style="border-top: 1px solid #34495e; margin: 0 auto; width: 80%; padding-top: 5px;">
                        ${getField('recebedor-nome') || 'Nome do Recebedor'}
                    </div>
                    <p style="font-size: 11px; margin-top: 5px; color: #7f8c8d;">Recebedor (Prestador)</p>
                </div>
                <div style="width: 40%; text-align: center;">
                    <div style="border-top: 1px solid #34495e; margin: 0 auto; width: 80%; padding-top: 5px;">
                        ${getField('pagador-nome') || 'Nome do Pagador'}
                    </div>
                    <p style="font-size: 11px; margin-top: 5px; color: #7f8c8d;">Pagador (Cliente)</p>
                </div>
            </div>
        </div>
    `;

    document.getElementById('preview').innerHTML = html;
}

// --- Funções de Validação ---
function validarFormulario() {
    const camposRecebedor = [
        'recebedor-nome', 'recebedor-doc', 'recebedor-tel', 'recebedor-cep',
        'recebedor-rua', 'recebedor-num', 'recebedor-cidade', 'recebedor-uf'
    ];

    for (let campo of camposRecebedor) {
        const el = document.getElementById(campo);
        if (!el.value.trim()) {
            alert(`O campo "${el.previousElementSibling.textContent.replace('*', '').trim()}" do RECEBEDOR é obrigatório.`);
            el.focus();
            return false;
        }
    }
    
    const camposPeriodo = ['periodo-inicio', 'periodo-fim'];
     for (let campo of camposPeriodo) {
        const el = document.getElementById(campo);
        if (!el.value) {
            alert(`O campo "${el.previousElementSibling.textContent.replace('*', '').trim()}" é obrigatório.`);
            el.focus();
            return false;
        }
    }
    
    const inicio = new Date(document.getElementById('periodo-inicio').value);
    const fim = new Date(document.getElementById('periodo-fim').value);
    if (fim < inicio) {
        alert('A data de término não pode ser anterior à data de início.');
        return false;
    }

    if (servicos.length === 0) {
        alert('Adicione pelo menos um produto ou serviço.');
        return false;
    }

    for (let i = 0; i < servicos.length; i++) {
        const s = servicos[i];
        if (!s.descricao.trim() || s.quantidade <= 0 || s.preco <= 0) {
            alert(`O serviço #${i + 1} está incompleto. Todos os serviços devem ter descrição, quantidade > 0 e preço > 0.`);
            return false;
        }
    }

    return true;
}

// --- FUNÇÃO DE GERAR PDF COM PDFMAKE (CORRIGIDA A FONTE) ---
function gerarPDF() {
    if (!validarFormulario()) return;
    
    // Verificação de segurança para o PDFMake
    if (typeof pdfMake === 'undefined' || typeof pdfMake.vfs === 'undefined') {
        alert("Erro: O PDFMake ou as fontes não foram carregadas corretamente. O PDF não pode ser gerado.");
        console.error("ERRO CRÍTICO: PDFMake não encontrado.");
        return;
    }

    const getField = (id) => document.getElementById(id).value;
    const totalGeral = calcularTotal();

    // Endereço formatado (completo)
    const formatarEnderecoPDF = (tipo) => {
        const rua = getField(tipo + '-rua');
        const num = getField(tipo + '-num');
        const comp = getField(tipo + '-comp');
        const cidade = getField(tipo + '-cidade');
        const uf = getField(tipo + '-uf');
        const cep = getField(tipo + '-cep');

        const linhas = [];
        if (rua && num) linhas.push({ text: `${rua}, ${num}` });
        if (comp) linhas.push({ text: `Compl.: ${comp}` });
        if (cidade && uf) linhas.push({ text: `${cidade}/${uf}`, margin: [0, 2, 0, 0] });
        if (cep) linhas.push({ text: `CEP: ${cep}` });
        
        return linhas.length > 0 ? linhas : [{ text: 'N/A' }];
    };

    const recebedorEnd = formatarEnderecoPDF('recebedor');
    const pagadorEnd = formatarEnderecoPDF('pagador');

    // Período
    const periodoTipo = document.getElementById('periodo-tipo').options[document.getElementById('periodo-tipo').selectedIndex].text;
    const dataInicioInput = getField('periodo-inicio');
    const dataFimInput = getField('periodo-fim');
    const formatarData = (data) => new Date(data + 'T03:00:00').toLocaleDateString('pt-BR');
    const textoPeriodicidade = `${periodoTipo} de ${formatarData(dataInicioInput)} a ${formatarData(dataFimInput)}`;

    // --- Tabela de Serviços (Document Definition) ---
    const tableBody = [
        [{ text: 'Descrição', bold: true, fillColor: '#34495e', color: '#FFFFFF', alignment: 'left' }, 
         { text: 'Qtd', bold: true, fillColor: '#34495e', color: '#FFFFFF', alignment: 'center' }, 
         { text: 'Preço Unit.', bold: true, fillColor: '#34495e', color: '#FFFFFF', alignment: 'right' }, 
         { text: 'Total', bold: true, fillColor: '#34495e', color: '#FFFFFF', alignment: 'right' }]
    ];

    servicos.forEach(s => {
        tableBody.push([
            { text: s.descricao || 'N/D', alignment: 'left' },
            { text: s.quantidade.toString(), alignment: 'center' },
            { text: formatarMoeda(s.preco), alignment: 'right' },
            { text: formatarMoeda(s.quantidade * s.preco), alignment: 'right', bold: true }
        ]);
    });

    // Linha do Total
    tableBody.push([
        { text: 'TOTAL FINAL', colSpan: 3, bold: true, alignment: 'right', fillColor: '#ecf0f1' },
        {},
        {},
        { text: formatarMoeda(totalGeral), alignment: 'right', bold: true, fillColor: '#ecf0f1', color: '#3498db' }
    ]);


    // --- Document Definition (Estrutura do PDF) ---
    const docDefinition = {
        pageSize: 'A4',
        pageMargins: [ 40, 40, 40, 40 ],
        defaultStyle: {
            // CORREÇÃO: Usando 'Roboto', a fonte padrão embutida no vfs_fonts.js
            font: 'Roboto' 
        },
        content: [
            // Título
            { text: 'R E C I B O', fontSize: 32, bold: true, alignment: 'center', color: '#34495e' },
            { text: 'DE PAGAMENTO', fontSize: 18, alignment: 'center', color: '#7f8c8d', margin: [0, 5, 0, 10] },
            { text: `VALOR TOTAL: ${formatarMoeda(totalGeral)}`, fontSize: 16, bold: true, alignment: 'center', color: '#2ecc71', margin: [0, 0, 0, 20] },

            // Linha Separadora
            { canvas: [ { type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 1, lineColor: '#3498db' } ], margin: [0, 0, 0, 15] },

            // --- Bloco Recebedor ---
            { text: 'RECEBEDOR (Prestador de Serviço)', style: 'sectionHeader' },
            {
                columns: [
                    { width: 100, stack: [
                        { text: `${recebedorType === 'pf' ? 'Nome' : 'Razão Social'}:`, style: 'label' },
                        { text: `${recebedorType === 'pf' ? 'CPF' : 'CNPJ'}:`, style: 'label' },
                        { text: 'Telefone:', style: 'label' },
                        { text: 'Endereço:', style: 'label', margin: [0, 5, 0, 0] },
                    ]},
                    { width: '*', stack: [
                        { text: getField('recebedor-nome') || '—', style: 'value' },
                        { text: getField('recebedor-doc') || '—', style: 'value' },
                        { text: getField('recebedor-tel') || '—', style: 'value' },
                        { stack: recebedorEnd, margin: [0, 5, 0, 0] }
                    ]}
                ],
                columnGap: 10,
                margin: [0, 0, 0, 15]
            },

            // --- Bloco Pagador ---
            { text: 'PAGADOR (Cliente)', style: 'sectionHeader' },
            {
                columns: [
                    { width: 100, stack: [
                        { text: `${pagadorType === 'pf' ? 'Nome' : 'Razão Social'}:`, style: 'label' },
                        { text: `${pagadorType === 'pf' ? 'CPF' : 'CNPJ'}:`, style: 'label' },
                        { text: 'Endereço:', style: 'label', margin: [0, 5, 0, 0] },
                    ]},
                    { width: '*', stack: [
                        { text: getField('pagador-nome') || '—', style: 'value' },
                        { text: getField('pagador-doc') || '—', style: 'value' },
                        { stack: pagadorEnd, margin: [0, 5, 0, 0] }
                    ]}
                ],
                columnGap: 10,
                margin: [0, 0, 0, 15]
            },
            
            // --- Bloco Período ---
            { text: 'PERÍODO DE PRESTAÇÃO', style: 'sectionHeader' },
            {
                columns: [
                    { width: 100, text: 'Referente a:', style: 'label' },
                    { width: '*', text: textoPeriodicidade, style: 'value' }
                ],
                margin: [0, 0, 0, 20]
            },

            // --- Tabela de Serviços ---
            { text: 'DISCRIMINAÇÃO DOS SERVIÇOS/PRODUTOS', style: 'sectionHeader' },
            {
                style: 'itemsTable',
                table: {
                    headerRows: 1,
                    // Definição das Larguras (Proporcional)
                    widths: ['*', 40, 70, 70], 
                    body: tableBody
                },
                layout: {
                    fillColor: function (rowIndex, node, columnIndex) {
                        return (rowIndex % 2 === 0) ? '#f2f2f2' : null;
                    },
                    hLineWidth: (i, node) => (i === 0 || i === 1 || i === node.table.body.length) ? 1 : 0.5,
                    vLineWidth: (i) => 0,
                    hLineColor: (i) => (i === 1 || i === node.table.body.length) ? '#3498db' : '#bbbbbb',
                    paddingLeft: (i) => 10,
                    paddingRight: (i, node) => 10,
                    paddingTop: (i) => 5,
                    paddingBottom: (i) => 5,
                }
            },

            // --- Assinaturas ---
            { 
                text: 'E, para clareza e validade, o presente recibo é assinado abaixo:', 
                alignment: 'center', 
                margin: [0, 50, 0, 20],
                fontSize: 10
            },
            {
                columns: [
                    {
                        width: '50%',
                        stack: [
                            { canvas: [ { type: 'line', x1: 50, y1: 0, x2: 200, y2: 0, lineWidth: 1, lineColor: '#34495e' } ] },
                            { text: getField('recebedor-nome') || 'Nome do Recebedor', alignment: 'center', fontSize: 10, margin: [0, 5, 0, 0] },
                            { text: 'Recebedor (Prestador)', alignment: 'center', fontSize: 8, color: '#7f8c8d' }
                        ]
                    },
                    {
                        width: '50%',
                        stack: [
                            { canvas: [ { type: 'line', x1: 50, y1: 0, x2: 200, y2: 0, lineWidth: 1, lineColor: '#34495e' } ] },
                            { text: getField('pagador-nome') || 'Nome do Pagador', alignment: 'center', fontSize: 10, margin: [0, 5, 0, 0] },
                            { text: 'Pagador (Cliente)', alignment: 'center', fontSize: 8, color: '#7f8c8d' }
                        ]
                    }
                ]
            }
        ],

        // Estilos
        styles: {
            sectionHeader: {
                fontSize: 12,
                bold: true,
                color: '#34495e',
                fillColor: '#ecf0f1',
                decoration: 'underline',
                decorationColor: '#3498db',
                margin: [0, 10, 0, 5]
            },
            label: {
                bold: true,
                fontSize: 10,
                color: '#34495e'
            },
            value: {
                fontSize: 10,
                color: '#555'
            },
            itemsTable: {
                margin: [0, 5, 0, 15]
            }
        }
    };

    const recebedorNome = getField('recebedor-nome');
    const fileName = `recibo_${recebedorNome.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().slice(0,10)}.pdf`;

    pdfMake.createPdf(docDefinition).download(fileName);
}

// --- FUNÇÕES CRUD (Salvar, Carregar, Remover) --- 
function getFormData() {
    const data = {
        recebedorType,
        pagadorType,
        servicos: [...servicos] 
    };
    
    const fields = document.querySelectorAll('.form-section input, .form-section select');
    fields.forEach(field => {
        if (field.id) {
            data[field.id] = field.value;
        }
    });
    return data;
}

function populateForm(data) {
    setRecebedorType(data.recebedorType || 'pf');
    setPagadorType(data.pagadorType || 'pf');

    const fields = document.querySelectorAll('.form-section input, .form-section select');
    fields.forEach(field => {
        if (field.id && data[field.id] !== undefined) {
            field.value = data[field.id];
        }
    });

    servicos = data.servicos ? [...data.servicos] : [];
    
    renderizarServicos();
    atualizarPrevia();
}

function salvarRecibo() {
    let nome = prompt('Digite um nome para este modelo de recibo (Ex: Cliente X Mensal):');
    if (!nome || !nome.trim()) {
        alert('Nome inválido. O recibo não foi salvo.');
        return;
    }
    
    const data = getFormData();
    data.id = Date.now();
    data.nome = nome.trim();

    const existingIndex = recibosSalvos.findIndex(r => r.nome.toLowerCase() === data.nome.toLowerCase());
    if (existingIndex > -1) {
        if (!confirm('Já existe um recibo com esse nome. Deseja sobrescrevê-lo?')) {
            return;
        }
        data.id = recibosSalvos[existingIndex].id; 
        recibosSalvos[existingIndex] = data;
    } else {
         recibosSalvos.push(data);
    }

    localStorage.setItem('recibosGerador', JSON.stringify(recibosSalvos));
    renderRecibosSalvos();
    alert('Modelo de recibo salvo com sucesso!');
}

function carregarRecibo(id) {
    const recibo = recibosSalvos.find(r => r.id === id);
    if (recibo) {
        if (!confirm(`Deseja carregar o recibo "${recibo.nome}"? Suas alterações atuais serão perdidas.`)) {
            return;
        }
        populateForm(recibo);
    }
}

function removerRecibo(id) {
    const recibo = recibosSalvos.find(r => r.id === id);
    if (recibo && confirm(`Tem certeza que deseja excluir o recibo salvo "${recibo.nome}"?`)) {
        recibosSalvos = recibosSalvos.filter(r => r.id !== id);
        localStorage.setItem('recibosGerador', JSON.stringify(recibosSalvos));
        renderRecibosSalvos();
    }
}

function renderRecibosSalvos() {
    const listaDiv = document.getElementById('lista-recibos-salvos');
    if (recibosSalvos.length === 0) {
        listaDiv.innerHTML = '<p style="color: #999; text-align: center; padding: 10px;">Nenhum recibo salvo.</p>';
        return;
    }

    listaDiv.innerHTML = recibosSalvos.map(r => `
        <div class="saved-item">
            <span class="saved-item-name">${r.nome}</span>
            <div class="saved-item-actions">
                <button class="btn btn-load" onclick="carregarRecibo(${r.id})">Carregar</button>
                <button class="btn btn-delete" onclick="removerRecibo(${r.id})">Remover</button>
            </div>
        </div>
    `).join('');
}

// --- Inicialização ---
function init() {
    // CORREÇÃO: Removemos a configuração manual de 'Helvetica' para usar 'Roboto',
    // a fonte padrão embutida no vfs_fonts.js. Apenas garantimos que o vfs está disponível.
    if (typeof pdfMake !== 'undefined' && typeof vfs_fonts !== 'undefined') {
         Object.assign(pdfMake.vfs, vfs_fonts.pdfMake.vfs);
    }

    const salvos = localStorage.getItem('recibosGerador');
    if (salvos) {
        recibosSalvos = JSON.parse(salvos);
    }
    setRecebedorType('pf'); 
    setPagadorType('pf');
    
    renderRecibosSalvos();
    renderizarServicos();
    atualizarPrevia();
}

window.onload = init;