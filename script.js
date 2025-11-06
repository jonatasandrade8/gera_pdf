/* script.js */

// Estado inicial
let recebedorType = 'pf';
let pagadorType = 'pf';

// Event listener para carregar recibos salvos ao iniciar
document.addEventListener('DOMContentLoaded', () => {
    renderizarRecibosSalvos();
    // Define a data de hoje nos campos de data (opcional, mas útil)
    const hoje = new Date().toISOString().split('T')[0];
    document.getElementById('periodo-inicio').value = hoje;
    document.getElementById('periodo-fim').value = hoje;
    
    // Atualiza a prévia com "Aguardando preenchimento..."
    atualizarPrevia();
});

// --- CONTROLES DE TIPO (PF/PJ) ---

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

function formatarTelefone(input) {
    let v = input.value.replace(/\D/g, '');
    v = v.replace(/^(\d{2})(\d)/g, '($1) $2');
    v = v.replace(/(\d{5})(\d)/, '$1-$2');
    v = v.replace(/(\d{4})(\d)/, '$1-$2'); // Para telefones fixos
    input.value = v.slice(0, 15); // Limita o tamanho
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
    } else { // pj
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
    calcularTotal();
    atualizarPrevia();
}

function parseMoeda(valorString) {
    if (!valorString) return 0;
    let v = valorString.replace('R$ ', '').replace(/\./g, '').replace(',', '.');
    return parseFloat(v) || 0;
}

// --- LÓGICA DE SERVIÇOS/PRODUTOS ---

let servicoCount = 0;

function adicionarServico() {
    servicoCount++;
    const list = document.getElementById('services-list');
    
    // Limpa a mensagem "Nenhum produto" se for o primeiro item
    if (servicoCount === 1) {
        list.innerHTML = '';
    }
    
    const item = document.createElement('div');
    item.className = 'service-item';
    item.id = `service-${servicoCount}`;
    item.innerHTML = `
        <input type="text" placeholder="Descrição do Produto/Serviço" class="servico-desc" oninput="atualizarPrevia()">
        <input type="number" value="1" min="1" class="servico-qtd" oninput="calcularTotal(); atualizarPrevia()">
        <input type="text" placeholder="R$ 0,00" class="servico-valor" oninput="formatarMoeda(this)">
        <button class="btn-remove" onclick="removerServico('service-${servicoCount}')">X</button>
    `;
    list.appendChild(item);
    atualizarPrevia();
}

function removerServico(itemId) {
    document.getElementById(itemId).remove();
    servicoCount--;
    
    const list = document.getElementById('services-list');
    if (servicoCount === 0) {
        list.innerHTML = '<p style="color: #999; text-align: center; padding: 20px;">Nenhum produto/serviço adicionado</p>';
    }
    calcularTotal();
    atualizarPrevia();
}

function calcularTotal() {
    let total = 0;
    const items = document.querySelectorAll('.service-item');
    items.forEach(item => {
        const qtd = parseFloat(item.querySelector('.servico-qtd').value) || 0;
        const valor = parseMoeda(item.querySelector('.servico-valor').value);
        total += qtd * valor;
    });
    
    const totalFormatado = total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    document.getElementById('total-amount').innerText = totalFormatado;
}

// --- BUSCA DE APIS EXTERNAS (CEP/CNPJ) ---

// Função auxiliar para sanitizar (remover não-dígitos)
function limparInput(valor) {
    return valor.replace(/\D/g, '');
}

async function buscarCEP(tipo) {
    const cep = limparInput(document.getElementById(`${tipo}-cep`).value);
    if (cep.length !== 8) return;

    // Utilizamos a API ViaCEP. É crucial usar HTTPS.
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
        // Foca no número, pois é o próximo campo provável
        document.getElementById(`${tipo}-num`).focus();
        atualizarPrevia();

    } catch (error) {
        console.error('Falha ao buscar CEP:', error);
        alert('Não foi possível buscar o CEP. Verifique a conexão ou o valor digitado.');
    }
}

async function buscarCNPJ(tipo) {
    const type = (tipo === 'recebedor') ? recebedorType : pagadorType;
    if (type !== 'pj') return; // Só busca se for PJ

    const cnpj = limparInput(document.getElementById(`${tipo}-doc`).value);
    if (cnpj.length !== 14) return;

    // Utilizamos a BrasilAPI. Em produção, considere um proxy para evitar rate-limiting.
    // Esta API é pública e pode sofrer instabilidades.
    const url = `https://brasilapi.com.br/api/cnpj/v1/${cnpj}`;

    try {
        // Simples feedback de carregamento
        document.getElementById(`${tipo}-nome`).value = "Buscando...";

        const response = await fetch(url);
        if (!response.ok) throw new Error('CNPJ não encontrado ou API indisponível');
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
        alert('Não foi possível buscar o CNPJ. Verifique o valor digitado ou a API pode estar fora do ar.');
        document.getElementById(`${tipo}-nome`).value = ""; // Limpa o "Buscando..."
    }
}


// --- LÓGICA DE PRÉVIA (SIMPLIFICADA) ---

function atualizarPrevia() {
    // A prévia em tempo real é complexa.
    // Por enquanto, ela recalcula o total e atualiza a prévia básica.
    calcularTotal();
    
    // Simulação de prévia
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

const STORAGE_KEY = 'geradorRecibosModelos';

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
        servicos: [],
        periodo: {
            tipo: document.getElementById('periodo-tipo').value,
            inicio: document.getElementById('periodo-inicio').value,
            fim: document.getElementById('periodo-fim').value,
        }
    };
    
    // 2. Coletar serviços
    document.querySelectorAll('.service-item').forEach(item => {
        formData.servicos.push({
            desc: item.querySelector('.servico-desc').value,
            qtd: item.querySelector('.servico-qtd').value,
            valor: item.querySelector('.servico-valor').value,
        });
    });

    // 3. Salvar no LocalStorage
    // Usamos o nome do recebedor + data como "nome" do recibo
    const nomeRecibo = formData.recebedor.nome || 'Recibo Sem Nome';
    const dataRecibo = new Date().toLocaleDateString('pt-BR');
    const reciboSalvo = {
        id: Date.now(), // ID único
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

    // Carregar Serviços
    const list = document.getElementById('services-list');
    list.innerHTML = '';
    servicoCount = 0;
    formData.servicos.forEach(servico => {
        adicionarServico(); // Cria um novo item
        const ultimoItem = list.lastChild;
        ultimoItem.querySelector('.servico-desc').value = servico.desc;
        ultimoItem.querySelector('.servico-qtd').value = servico.qtd;
        ultimoItem.querySelector('.servico-valor').value = servico.valor; // O formatador será chamado no oninput se quisermos
    });
    
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

// Validação de campos obrigatórios
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
    
    if (servicoCount === 0) {
        erros.push('Adicione pelo menos um Produto/Serviço');
    }

    if (erros.length > 0) {
        alert('Por favor, preencha os seguintes campos obrigatórios:\n- ' + erros.join('\n- '));
        return false;
    }
    return true;
}

// Função auxiliar para formatar data (dd/mm/aaaa)
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

    // 2. Montar Tabela de Serviços
    const corpoTabela = [
        [{text: 'Descrição', style: 'tableHeader'}, {text: 'Qtd.', style: 'tableHeader'}, {text: 'Valor Unit.', style: 'tableHeader'}, {text: 'Subtotal', style: 'tableHeader'}]
    ];
    
    document.querySelectorAll('.service-item').forEach(item => {
        const desc = item.querySelector('.servico-desc').value || 'Item não descrito';
        const qtd = parseFloat(item.querySelector('.servico-qtd').value) || 0;
        const valorUnitStr = item.querySelector('.servico-valor').value;
        const valorUnit = parseMoeda(valorUnitStr);
        const subtotal = (qtd * valorUnit).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        
        corpoTabela.push([
            desc,
            qtd.toString(),
            valorUnit.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
            { text: subtotal, alignment: 'right' }
        ]);
    });

    // 3. Montar Definição do Documento (docDefinition)
    const docDefinition = {
        pageSize: 'A4',
        pageMargins: [40, 60, 40, 60], // [left, top, right, bottom]

        // Cabeçalho
        header: {
            text: 'RECIBO DE PRESTAÇÃO DE SERVIÇOS',
            style: 'header',
            alignment: 'center',
            margin: [0, 20, 0, 20] // Margem [left, top, right, bottom]
        },

        // Rodapé (Número da página)
        footer: function(currentPage, pageCount) {
            return {
                text: `Página ${currentPage.toString()} de ${pageCount}`,
                alignment: 'center',
                style: 'footer'
            };
        },

        // Conteúdo Principal
        content: [
            // Seção de Informações
            {
                columns: [
                    // Coluna do Recebedor (Prestador)
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
                    // Coluna do Pagador (Cliente)
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
            
            // Período de Prestação
            {
                text: [
                    {text: 'Período da Prestação (Referente a ' + periodoTipo + '):\n', style: 'subheader', margin: [0, 20, 0, 5]},
                    {text: `De ${periodoInicio} até ${periodoFim}`, alignment: 'center'}
                ],
                margin: [0, 10, 0, 10]
            },

            // Tabela de Serviços
            {
                text: 'ITENS/SERVIÇOS PRESTADOS',
                style: 'subheader',
                margin: [0, 15, 0, 5]
            },
            {
                table: {
                    headerRows: 1,
                    widths: ['*', 'auto', 'auto', 'auto'], // '*' usa o espaço restante
                    body: corpoTabela
                },
                layout: 'lightHorizontalLines' // Estilo da tabela
            },
            
            // Total
            {
                text: `TOTAL: ${total}`,
                style: 'total',
                alignment: 'right',
                margin: [0, 10, 0, 30]
            },

            // Texto de Confirmação
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

            // Data e Assinatura
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

        // Estilos
        styles: {
            header: {
                fontSize: 18,
                bold: true,
                color: '#2c3e50'
            },
            subheader: {
                fontSize: 14,
                bold: true,
                color: '#34495e',
                margin: [0, 10, 0, 5]
            },
            infoBox: {
                fontSize: 10,
                lineHeight: 1.3
            },
            tableHeader: {
                bold: true,
                fontSize: 11,
                color: '#FFFFFF',
                fillColor: '#34495e',
                alignment: 'left'
            },
            total: {
                fontSize: 16,
                bold: true,
                color: '#2c3e50'
            },
            paragraph: {
                fontSize: 11,
                lineHeight: 1.4
            },
            assinaturaDoc: {
                fontSize: 9,
                color: '#555'
            },
            footer: {
                fontSize: 9,
                color: '#999'
            }
        },
        
        defaultStyle: {
            font: 'Roboto' // PDFMake usa Roboto por padrão (vfs_fonts.js)
        }
    };

    // 4. Gerar o PDF
    pdfMake.createPdf(docDefinition).download(`Recibo_${recebedor.nome.split(' ')[0]}_${periodoFim.replace(/\//g, '-')}.pdf`);
}