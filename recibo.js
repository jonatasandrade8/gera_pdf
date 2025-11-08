/* recibo.js - Refatorado com State-First */

// --- Estado Global ---
let recebedorType = 'pf';
let pagadorType = 'pf';
let servicos = []; // Array para gerenciar o estado dos serviços
const STORAGE_KEY = 'geradorRecibosModelos';

// --- Inicialização ---
document.addEventListener('DOMContentLoaded', () => {
    // Define a data de hoje nos campos de data
    const hoje = new Date().toISOString().split('T')[0];
    document.getElementById('periodo-inicio').value = hoje;
    document.getElementById('periodo-fim').value = hoje;
    
    // Renderiza a lista de recibos salvos e a tabela inicial
    renderizarRecibosSalvos();
    renderizarServicos(); 
    atualizarPrevia();
});

// --- CONTROLES DE TIPO (PF/PJ) ---
// (Funções setRecebedorType e setPagadorType permanecem as mesmas)
function setRecebedorType(tipo) {
    recebedorType = tipo;
    document.getElementById('btn-recebedor-pf').classList.toggle('active', tipo === 'pf');
    document.getElementById('btn-recebedor-pj').classList.toggle('active', tipo === 'pj');
    
    const labelNome = document.getElementById('label-recebedor-nome');
    const labelDoc = document.getElementById('label-recebedor-doc');
    const inputDoc = document.getElementById('recebedor-doc');

    if (tipo === 'pf') {
        labelNome.innerText = 'Nome Completo *';
        labelDoc.innerText = 'CPF *';
        inputDoc.placeholder = '000.000.000-00';
    } else {
        labelNome.innerText = 'Razão Social *';
        labelDoc.innerText = 'CNPJ *';
        inputDoc.placeholder = '00.000.000/0001-00';
    }
    inputDoc.value = ''; // Limpa o campo ao trocar
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
        inputDoc.placeholder = '00.000.000/0001-00';
    }
    inputDoc.value = ''; // Limpa o campo ao trocar
}

// --- FORMATAÇÃO DE INPUTS (MÁSCARAS) ---
// (Funções formatarTelefone, formatarCEP, formatarDocumento, formatarMoeda, parseMoeda permanecem as mesmas)
function formatarTelefone(input) {
    let v = input.value.replace(/\D/g, '');
    v = v.replace(/^(\d{2})(\d)/g, '($1) $2');
    v = v.replace(/(\d{5})(\d)/, '$1-$2');
    v = v.replace(/(\d{4})(\d)/, '$1-$2'); 
    input.value = v.slice(0, 15);
    atualizarPrevia();
}

function formatarCEP(input) {
    let v = input.value.replace(/\D/g, '');
    v = v.replace(/^(\d{5})(\d)/, '$1-$2');
    input.value = v.slice(0, 9);
    atualizarPrevia();
}

function formatarDocumento(input) {
    let v = input.value.replace(/\D/g, '');
    let type = (input.id.includes('recebedor')) ? recebedorType : pagadorType;

    if (type === 'pf') {
        v = v.replace(/(\d{3})(\d)/, '$1.$2');
        v = v.replace(/(\d{3})(\d)/, '$1.$2');
        v = v.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
        input.value = v.slice(0, 14);
    } else { 
        v = v.replace(/^(\d{2})(\d)/, '$1.$2');
        v = v.replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3');
        v = v.replace(/\.(\d{3})(\d)/, '.$1/$2');
        v = v.replace(/(\d{4})(\d)/, '$1-$2');
        input.value = v.slice(0, 18);
    }
    atualizarPrevia();
}

function formatarMoeda(input) {
    let v = input.value.replace(/\D/g, '');
    v = (v / 100).toFixed(2) + '';
    v = v.replace(".", ",");
    v = v.replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.');
    input.value = 'R$ ' + v;
    
    // Atualiza o estado ao formatar (necessário para cálculo)
    // Precisamos saber o índice deste input
    const tr = input.closest('tr');
    if (tr && tr.dataset.index) {
        const index = parseInt(tr.dataset.index, 10);
        const valorCru = parseMoeda(input.value);
        if (servicos[index] && servicos[index].valor !== valorCru) {
             servicos[index].valor = valorCru;
             calcularTotal();
        }
    }
}

function parseMoeda(valorString) {
    if (!valorString) return 0;
    let v = valorString.replace('R$ ', '').replace(/\./g, '').replace(',', '.');
    return parseFloat(v) || 0;
}


// --- LÓGICA DE SERVIÇOS/PRODUTOS (Refatorada) ---

function adicionarServico() {
    servicos.push({
        desc: '',
        qtd: 1,
        valor: 0.00
    });
    renderizarServicos();
    atualizarPrevia();
}

function removerServico(index) {
    servicos.splice(index, 1);
    renderizarServicos();
    calcularTotal();
    atualizarPrevia();
}

function atualizarServico(index, campo, valor) {
    if (!servicos[index]) return;

    if (campo === 'valor') {
        servicos[index].valor = parseMoeda(valor);
    } else if (campo === 'qtd') {
        servicos[index].qtd = parseInt(valor, 10) || 1;
    } else {
        servicos[index].desc = valor;
    }
    
    // Recalcula o subtotal dessa linha
    const tr = document.querySelector(`#services-tbody tr[data-index="${index}"]`);
    if (tr) {
        const subtotalCell = tr.querySelector('.service-subtotal');
        const subtotal = servicos[index].qtd * servicos[index].valor;
        subtotalCell.innerText = subtotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    }
    
    calcularTotal();
    atualizarPrevia();
}

function renderizarServicos() {
    const tbody = document.getElementById('services-tbody');
    tbody.innerHTML = ''; // Limpa a tabela

    if (servicos.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: #999; padding: 20px;">Nenhum produto/serviço adicionado</td></tr>';
        return;
    }

    servicos.forEach((item, index) => {
        const tr = document.createElement('tr');
        tr.dataset.index = index; // Guarda o índice na linha

        // Formata o valor (mostra vazio se for 0)
        const valorExibido = (item.valor === 0) ? '' : (item.valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        const subtotal = (item.qtd * item.valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

        tr.innerHTML = `
            <td>
                <input type="text" class="servico-desc" placeholder="Descrição do Produto/Serviço" value="${item.desc}"
                       oninput="atualizarServico(${index}, 'desc', this.value)">
            </td>
            <td>
                <input type="number" class="servico-qtd" value="${item.qtd}" min="1"
                       oninput="atualizarServico(${index}, 'qtd', this.value)">
            </td>
            <td>
                <input type="text" class="servico-valor" placeholder="R$ 0,00" value="${valorExibido.replace('R$ ', 'R$ ')}"
                       oninput="formatarMoeda(this)" 
                       onblur="atualizarServico(${index}, 'valor', this.value)">
            </td>
            <td class="service-subtotal" style="text-align: right; white-space: nowrap;">
                ${subtotal}
            </td>
            <td>
                <button class="remove-btn" onclick="removerServico(${index})">X</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function calcularTotal() {
    // Calcula o total a partir do array 'servicos'
    let total = servicos.reduce((acc, item) => {
        return acc + (item.qtd * item.valor);
    }, 0);
    
    const totalFormatado = total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    document.getElementById('total-amount').innerText = totalFormatado;
}


// --- BUSCA DE APIS EXTERNAS (CEP/CNPJ) ---
// (Funções limparInput, buscarCEP, buscarCNPJ permanecem as mesmas)
function limparInput(valor) {
    return valor.replace(/\D/g, '');
}

async function buscarCEP(tipo) {
    const cep = limparInput(document.getElementById(`${tipo}-cep`).value);
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

        document.getElementById(`${tipo}-rua`).value = data.logradouro || '';
        document.getElementById(`${tipo}-cidade`).value = data.localidade || '';
        document.getElementById(`${tipo}-uf`).value = data.uf || '';
        document.getElementById(`${tipo}-num`).focus();
        atualizarPrevia();

    } catch (error) {
        console.error('Falha ao buscar CEP:', error);
        alert('Não foi possível buscar o CEP.');
    }
}

async function buscarCNPJ(tipo) {
    const type = (tipo === 'recebedor') ? recebedorType : pagadorType;
    if (type !== 'pj') return; 

    const cnpj = limparInput(document.getElementById(`${tipo}-doc`).value);
    if (cnpj.length !== 14) return;

    const url = `https://brasilapi.com.br/api/cnpj/v1/${cnpj}`;

    try {
        document.getElementById(`${tipo}-nome`).value = "Buscando...";
        const response = await fetch(url);
        if (!response.ok) throw new Error('CNPJ não encontrado');
        const data = await response.json();

        document.getElementById(`${tipo}-nome`).value = data.razao_social || '';
        document.getElementById(`${tipo}-cep`).value = data.cep ? data.cep.replace(/\D/g, '').replace(/^(\d{5})(\d)/, '$1-$2') : '';
        document.getElementById(`${tipo}-rua`).value = data.logradouro || '';
        document.getElementById(`${tipo}-num`).value = data.numero || '';
        document.getElementById(`${tipo}-cidade`).value = data.municipio || '';
        document.getElementById(`${tipo}-uf`).value = data.uf || '';
        document.getElementById(`${tipo}-tel`).value = data.ddd_telefone_1 || '';
        atualizarPrevia();

    } catch (error) {
        console.error('Falha ao buscar CNPJ:', error);
        alert('Não foi possível buscar o CNPJ.');
        document.getElementById(`${tipo}-nome`).value = ""; 
    }
}


// --- LÓGICA DE PRÉVIA ---
// (Função atualizarPrevia permanece a mesma)
function atualizarPrevia() {
    const preview = document.getElementById('preview');
    const recebedorNome = document.getElementById('recebedor-nome').value;
    const pagadorNome = document.getElementById('pagador-nome').value;
    const total = document.getElementById('total-amount').innerText;
    
    if (!recebedorNome && !pagadorNome && total === 'R$ 0,00') {
        preview.innerHTML = '<p style="color: #999; text-align: center;">Aguardando preenchimento...</p>';
    } else {
         preview.innerHTML = `
            <div style="width: 100%; text-align: left; padding: 15px; font-family: Arial, sans-serif;">
                <h3 style="text-align: center; border-bottom: 1px solid #eee; padding-bottom: 10px;">PRÉVIA DO RECIBO</h3>
                <p><strong>Recebedor:</strong> ${recebedorNome || '...'}</p>
                <p><strong>Pagador:</strong> ${pagadorNome || '...'}</p>
                <hr style="margin: 15px 0;">
                <h2 style="text-align: right; color: #333;">Total: ${total}</h2>
            </div>
        `;
    }
}

// --- GERENCIAMENTO DE RECIBOS (LocalStorage) ---

function getRecibosSalvos() {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
}

function salvarRecibo() {
    // 1. Coletar dados do formulário
    const formData = {
        recebedor: {
            tipo: recebedorType,
            nome: document.getElementById('recebedor-nome').value,
            doc: document.getElementById('recebedor-doc').value,
            tel: document.getElementById('recebedor-tel').value,
            cep: document.getElementById('recebedor-cep').value,
            rua: document.getElementById('recebedor-rua').value,
            num: document.getElementById('recebedor-num').value,
            comp: document.getElementById('recebedor-comp').value,
            cidade: document.getElementById('recebedor-cidade').value,
            uf: document.getElementById('recebedor-uf').value,
        },
        pagador: {
            tipo: pagadorType,
            nome: document.getElementById('pagador-nome').value,
            doc: document.getElementById('pagador-doc').value,
            tel: document.getElementById('pagador-tel').value,
            cep: document.getElementById('pagador-cep').value,
            rua: document.getElementById('pagador-rua').value,
            num: document.getElementById('pagador-num').value,
            comp: document.getElementById('pagador-comp').value,
            cidade: document.getElementById('pagador-cidade').value,
            uf: document.getElementById('pagador-uf').value,
        },
        // 2. Coletar serviços (Agora direto do array global)
        servicos: servicos, 
        periodo: {
            tipo: document.getElementById('periodo-tipo').value,
            inicio: document.getElementById('periodo-inicio').value,
            fim: document.getElementById('periodo-fim').value,
        }
    };
    
    // 3. Salvar no LocalStorage
    const nomeRecibo = formData.recebedor.nome || 'Recibo Sem Nome';
    const dataRecibo = new Date().toLocaleDateString('pt-BR');
    const reciboSalvo = {
        id: Date.now(), 
        nome: `${nomeRecibo} (${dataRecibo})`,
        data: formData
    };
    
    const recibos = getRecibosSalvos();
    recibos.push(reciboSalvo);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(recibos));
    
    alert('Modelo de recibo salvo com sucesso!');
    renderizarRecibosSalvos();
}

function renderizarRecibosSalvos() {
    const lista = document.getElementById('lista-recibos-salvos');
    const recibos = getRecibosSalvos();
    
    if (recibos.length === 0) {
        lista.innerHTML = '<p style="color: #999; text-align: center; padding: 10px;">Nenhum recibo salvo.</p>';
        return;
    }
    
    lista.innerHTML = '';
    recibos.forEach((recibo) => {
        const item = document.createElement('div');
        item.className = 'saved-item';
        item.innerHTML = `
            <span>${recibo.nome}</span>
            <div class="saved-item-actions">
                <button class="btn-load" onclick="carregarRecibo(${recibo.id})">Carregar</button>
                <button class="btn-delete" onclick="excluirRecibo(${recibo.id})">Excluir</button>
            </div>
        `;
        lista.appendChild(item);
    });
}

function carregarRecibo(id) {
    const recibos = getRecibosSalvos();
    const recibo = recibos.find(r => r.id === id);
    if (!recibo) return;
    
    const formData = recibo.data;

    // Carregar Recebedor
    setRecebedorType(formData.recebedor.tipo);
    document.getElementById('recebedor-nome').value = formData.recebedor.nome;
    document.getElementById('recebedor-doc').value = formData.recebedor.doc;
    document.getElementById('recebedor-tel').value = formData.recebedor.tel;
    document.getElementById('recebedor-cep').value = formData.recebedor.cep;
    document.getElementById('recebedor-rua').value = formData.recebedor.rua;
    document.getElementById('recebedor-num').value = formData.recebedor.num;
    document.getElementById('recebedor-comp').value = formData.recebedor.comp;
    document.getElementById('recebedor-cidade').value = formData.recebedor.cidade;
    document.getElementById('recebedor-uf').value = formData.recebedor.uf;

    // Carregar Pagador
    setPagadorType(formData.pagador.tipo);
    document.getElementById('pagador-nome').value = formData.pagador.nome;
    document.getElementById('pagador-doc').value = formData.pagador.doc;
    document.getElementById('pagador-tel').value = formData.pagador.tel;
    document.getElementById('pagador-cep').value = formData.pagador.cep;
    document.getElementById('pagador-rua').value = formData.pagador.rua;
    document.getElementById('pagador-num').value = formData.pagador.num;
    document.getElementById('pagador-comp').value = formData.pagador.comp;
    document.getElementById('pagador-cidade').value = formData.pagador.cidade;
    document.getElementById('pagador-uf').value = formData.pagador.uf;

    // Carregar Período
    document.getElementById('periodo-tipo').value = formData.periodo.tipo;
    document.getElementById('periodo-inicio').value = formData.periodo.inicio;
    document.getElementById('periodo-fim').value = formData.periodo.fim;

    // Carregar Serviços (Agora para o array global e renderiza)
    servicos = formData.servicos || [];
    renderizarServicos();
    
    calcularTotal();
    atualizarPrevia();
    alert('Modelo carregado!');
}

function excluirRecibo(id) {
    if (!confirm('Tem certeza que deseja excluir este modelo?')) return;
    
    let recibos = getRecibosSalvos();
    recibos = recibos.filter(r => r.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(recibos));
    renderizarRecibosSalvos();
}


// --- GERAÇÃO DE PDF (PDFMake) ---

// (Função validarCampos permanece a mesma)
function validarCampos() {
    const camposObrigatorios = [
        'recebedor-nome', 'recebedor-doc', 'recebedor-tel', 'recebedor-cep', 
        'recebedor-rua', 'recebedor-num', 'recebedor-cidade', 'recebedor-uf',
        'periodo-inicio', 'periodo-fim'
    ];
    
    let erros = [];
    camposObrigatorios.forEach(id => {
        const input = document.getElementById(id);
        if (!input.value) {
            erros.push(input.previousElementSibling.innerText.replace('*', '')); // Pega o label
            input.style.borderColor = '#e74c3c'; // Destaca o campo
        } else {
            input.style.borderColor = '#ccc';
        }
    });
    
    if (servicos.length === 0) { // Valida o array
        erros.push('Adicione pelo menos um Produto/Serviço');
    }

    if (erros.length > 0) {
        alert('Por favor, preencha os seguintes campos obrigatórios:\n- ' + erros.join('\n- '));
        return false;
    }
    return true;
}

// (Função formatarDataExtenso permanece a mesma)
function formatarDataExtenso(dataStr) {
    if (!dataStr) return 'Data não informada';
    const [ano, mes, dia] = dataStr.split('-');
    const data = new Date(ano, mes - 1, dia); // Mês é base 0
    return data.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
}


function gerarPDF() {
    if (!validarCampos()) {
        return;
    }

    // 1. Coletar todos os dados
    const recebedor = {
        nome: document.getElementById('recebedor-nome').value,
        doc: document.getElementById('recebedor-doc').value + (recebedorType === 'pf' ? ' (CPF)' : ' (CNPJ)'),
        tel: document.getElementById('recebedor-tel').value,
        rua: document.getElementById('recebedor-rua').value,
        num: document.getElementById('recebedor-num').value,
        comp: document.getElementById('recebedor-comp').value,
        cidade: document.getElementById('recebedor-cidade').value,
        uf: document.getElementById('recebedor-uf').value,
        cep: document.getElementById('recebedor-cep').value,
    };
    
    const pagador = {
        nome: document.getElementById('pagador-nome').value || 'Não informado',
        doc: (document.getElementById('pagador-doc').value || 'Não informado') + (pagadorType === 'pf' ? ' (CPF)' : ' (CNPJ)'),
        tel: document.getElementById('pagador-tel').value || 'Não informado',
        rua: document.getElementById('pagador-rua').value,
        num: document.getElementById('pagador-num').value,
        comp: document.getElementById('pagador-comp').value,
        cidade: document.getElementById('pagador-cidade').value,
        uf: document.getElementById('pagador-uf').value,
        cep: document.getElementById('pagador-cep').value,
    };
    
    const periodoTipo = document.getElementById('periodo-tipo').value;
    const periodoInicio = formatarDataExtenso(document.getElementById('periodo-inicio').value);
    const periodoFim = formatarDataExtenso(document.getElementById('periodo-fim').value);
    
    const total = document.getElementById('total-amount').innerText;

    // 2. Montar Tabela de Serviços (Lendo do array 'servicos')
    const corpoTabela = [
        [{text: 'Descrição', style: 'tableHeader'}, {text: 'Qtd.', style: 'tableHeader'}, {text: 'Valor Unit.', style: 'tableHeader'}, {text: 'Subtotal', style: 'tableHeader'}]
    ];
    
    servicos.forEach(item => {
        const desc = item.desc || 'Item não descrito';
        const qtd = item.qtd || 0;
        const valorUnit = item.valor || 0;
        const subtotal = (qtd * valorUnit).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        
        corpoTabela.push([
            desc,
            qtd.toString(),
            valorUnit.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
            { text: subtotal, alignment: 'right' }
        ]);
    });

    // 3. Montar Definição do Documento (docDefinition)
    // (docDefinition permanece o mesmo, pois já lia os dados das variáveis)
    const docDefinition = {
        pageSize: 'A4',
        pageMargins: [40, 60, 40, 60], 
        header: {
            text: 'RECIBO DE PRESTAÇÃO DE SERVIÇOS',
            style: 'header',
            alignment: 'center',
            margin: [0, 20, 0, 20]
        },
        footer: function(currentPage, pageCount) {
            return {
                text: `Página ${currentPage.toString()} de ${pageCount}`,
                alignment: 'center',
                style: 'footer'
            };
        },
        content: [
            {
                columns: [
                    {
                        width: '50%',
                        text: [
                            { text: 'RECEBEDOR (PRESTADOR)\n', style: 'subheader' },
                            { text: `${recebedor.nome}\n` },
                            { text: `Doc.: ${recebedor.doc}\n` },
                            { text: `Tel.: ${recebedor.tel}\n\n` },
                            { text: `Endereço:\n`, bold: true },
                            { text: `${recebedor.rua}, ${recebedor.num} ${recebedor.comp ? '(' + recebedor.comp + ')' : ''}\n` },
                            { text: `${recebedor.cidade} - ${recebedor.uf}\n` },
                            { text: `CEP: ${recebedor.cep}` }
                        ],
                        style: 'infoBox'
                    },
                    {
                        width: '50%',
                        text: [
                            { text: 'PAGADOR (CLIENTE)\n', style: 'subheader' },
                            { text: `${pagador.nome}\n` },
                            { text: `Doc.: ${pagador.doc}\n` },
                            { text: `Tel.: ${pagador.tel}\n\n` },
                            { text: `Endereço:\n`, bold: true },
                            { text: `${pagador.rua || '...'}, ${pagador.num || '...'} ${pagador.comp ? '(' + pagador.comp + ')' : ''}\n` },
                            { text: `${pagador.cidade || '...'} - ${pagador.uf || '...'}\n` },
                            { text: `CEP: ${pagador.cep || '...'}` }
                        ],
                        style: 'infoBox'
                    }
                ],
                columnGap: 20
            },
            {
                text: [
                    {text: 'Período da Prestação (Referente a ' + periodoTipo + '):\n', style: 'subheader', margin: [0, 20, 0, 5]},
                    {text: `De ${periodoInicio} até ${periodoFim}`, alignment: 'center'}
                ],
                margin: [0, 10, 0, 10]
            },
            {
                text: 'ITENS/SERVIÇOS PRESTADOS',
                style: 'subheader',
                margin: [0, 15, 0, 5]
            },
            {
                table: {
                    headerRows: 1,
                    widths: ['*', 'auto', 'auto', 'auto'],
                    body: corpoTabela
                },
                layout: 'lightHorizontalLines' 
            },
            {
                text: `TOTAL: ${total}`,
                style: 'total',
                alignment: 'right',
                margin: [0, 10, 0, 30]
            },
            {
                text: [
                    'Declaro que recebi da parte pagadora identificada acima, a importância de ',
                    { text: total, bold: true },
                    ' referente aos produtos/serviços detalhados neste documento. Este recibo quita integralmente os valores descritos.'
                ],
                style: 'paragraph',
                alignment: 'justify',
                margin: [0, 20, 0, 20]
            },
            {
                text: `${recebedor.cidade}, ${new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}.`,
                alignment: 'center',
                margin: [0, 30, 0, 30]
            },
            {
                text: '________________________________________',
                alignment: 'center',
                margin: [0, 20, 0, 5]
            },
            {
                text: recebedor.nome,
                alignment: 'center'
            },
            {
                text: recebedor.doc,
                alignment: 'center',
                style: 'assinaturaDoc'
            }
        ],
        styles: {
            header: { fontSize: 18, bold: true, color: '#2c3e50' },
            subheader: { fontSize: 14, bold: true, color: '#34495e', margin: [0, 10, 0, 5] },
            infoBox: { fontSize: 10, lineHeight: 1.3 },
            tableHeader: { bold: true, fontSize: 11, color: '#FFFFFF', fillColor: '#34495e', alignment: 'left' },
            total: { fontSize: 16, bold: true, color: '#2c3e50' },
            paragraph: { fontSize: 11, lineHeight: 1.4 },
            assinaturaDoc: { fontSize: 9, color: '#555' },
            footer: { fontSize: 9, color: '#999' }
        },
        defaultStyle: {
            font: 'Roboto' 
        }
    };

    // 4. Gerar o PDF
    pdfMake.createPdf(docDefinition).download(`Recibo_${recebedor.nome.split(' ')[0]}_${periodoFim.replace(/\//g, '-')}.pdf`);
}