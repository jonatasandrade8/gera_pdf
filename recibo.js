/* recibo.js - Refatorado com utils.js e toasts */

let recebedorType = 'pf';
let pagadorType = 'pf';
let servicos = [];
const STORAGE_KEY = 'geradorRecibosModelos';

document.addEventListener('DOMContentLoaded', () => {
    const hoje = hojeISO();
    document.getElementById('periodo-inicio').value = hoje;
    document.getElementById('periodo-fim').value = hoje;
    document.getElementById('periodo-data').value = hoje;
    renderizarRecibosSalvos();
    renderizarServicos();
    togglePeriodoRecibo();
    atualizarPrevia();
    atalhosTeclado({ 's': salvarRecibo, 'p': gerarPDF });
});

function togglePeriodoRecibo() {
    const tipo = document.getElementById('periodo-tipo').value;
    document.getElementById('periodo-range').style.display = (tipo === 'data') ? 'none' : '';
    document.getElementById('periodo-single').style.display = (tipo === 'data') ? 'block' : 'none';
}

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
    inputDoc.value = '';
    limparValidacao(['recebedor-doc']);
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
    inputDoc.value = '';
}

function formatarDocumentoInput(input) {
    const type = input.id.includes('recebedor') ? recebedorType : pagadorType;
    formatarDocumento(input, type);
    atualizarPrevia();
}

function formatarMoeda(input) {
    formatarMoedaInput(input);
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

function adicionarServico() {
    servicos.push({ desc: '', qtd: 1, valor: 0 });
    renderizarServicos();
    atualizarPrevia();
    showToast('Serviço adicionado!', 'success');
}

function removerServico(index) {
    servicos.splice(index, 1);
    renderizarServicos();
    calcularTotal();
    atualizarPrevia();
    showToast('Serviço removido.', 'info');
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
    const tr = document.querySelector(`#services-tbody tr[data-index="${index}"]`);
    if (tr) {
        const subtotalCell = tr.querySelector('.service-subtotal');
        const subtotal = servicos[index].qtd * servicos[index].valor;
        subtotalCell.innerText = formatarParaMoeda(subtotal);
    }
    calcularTotal();
    atualizarPrevia();
}

function renderizarServicos() {
    const tbody = document.getElementById('services-tbody');
    tbody.innerHTML = '';
    if (servicos.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: var(--text-light); padding: 20px;">Nenhum produto/serviço adicionado</td></tr>';
        return;
    }
    servicos.forEach((item, index) => {
        const tr = document.createElement('tr');
        tr.dataset.index = index;
        const valorExibido = (item.valor === 0) ? '' : formatarParaMoeda(item.valor);
        const subtotal = formatarParaMoeda(item.qtd * item.valor);
        tr.innerHTML = `
            <td><input type="text" placeholder="Descrição" value="${item.desc}" oninput="atualizarServico(${index}, 'desc', this.value)"></td>
            <td><input type="number" value="${item.qtd}" min="1" oninput="atualizarServico(${index}, 'qtd', this.value)"></td>
            <td><input type="text" placeholder="R$ 0,00" value="${valorExibido}" oninput="formatarMoeda(this)" onblur="atualizarServico(${index}, 'valor', this.value)"></td>
            <td class="service-subtotal" style="text-align: right; white-space: nowrap;">${subtotal}</td>
            <td><button class="remove-btn" onclick="removerServico(${index})">X</button></td>
        `;
        tbody.appendChild(tr);
    });
}

function calcularTotal() {
    let total = servicos.reduce((acc, item) => acc + (item.qtd * item.valor), 0);
    document.getElementById('total-amount').innerText = formatarParaMoeda(total);
}

async function buscarCEPField(tipo) {
    const cepInput = document.getElementById(`${tipo}-cep`);
    await buscarCEP(cepInput.value, {
        rua: document.getElementById(`${tipo}-rua`),
        cidade: document.getElementById(`${tipo}-cidade`),
        uf: document.getElementById(`${tipo}-uf`),
        num: document.getElementById(`${tipo}-num`)
    });
    atualizarPrevia();
}

async function buscarCNPJField(tipo) {
    const type = tipo === 'recebedor' ? recebedorType : pagadorType;
    if (type !== 'pj') return;
    const cnpjInput = document.getElementById(`${tipo}-doc`);
    showLoading(`${tipo}-nome`);
    const result = await buscarCNPJ(cnpjInput.value, {
        nome: document.getElementById(`${tipo}-nome`),
        cep: document.getElementById(`${tipo}-cep`),
        rua: document.getElementById(`${tipo}-rua`),
        num: document.getElementById(`${tipo}-num`),
        cidade: document.getElementById(`${tipo}-cidade`),
        uf: document.getElementById(`${tipo}-uf`),
        tel: document.getElementById(`${tipo}-tel`)
    });
    hideLoading(`${tipo}-nome`);
    atualizarPrevia();
}

function atualizarPrevia() {
    const preview = document.getElementById('preview');
    const recebedorNome = document.getElementById('recebedor-nome').value;
    const recebedorDoc = document.getElementById('recebedor-doc').value;
    const recebedorRua = document.getElementById('recebedor-rua').value;
    const recebedorNum = document.getElementById('recebedor-num').value;
    const recebedorCidade = document.getElementById('recebedor-cidade').value;
    const recebedorUf = document.getElementById('recebedor-uf').value;
    const pagadorNome = document.getElementById('pagador-nome').value;
    const total = document.getElementById('total-amount').innerText;

    if (!recebedorNome && !pagadorNome && total === 'R$ 0,00') {
        preview.innerHTML = '<p style="color: var(--text-light); text-align: center;">Aguardando preenchimento...</p>';
        return;
    }

    const periodoTipo = document.getElementById('periodo-tipo').value;
    const periodoData = document.getElementById('periodo-data').value;
    const periodoInicio = document.getElementById('periodo-inicio').value;
    const periodoFim = document.getElementById('periodo-fim').value;
    const observacoes = document.getElementById('observacoes').value;

    let periodoHtml = '';
    if (periodoTipo === 'data' && periodoData) {
        periodoHtml = `<p style="font-size: 9pt; color: #555; margin-bottom: 8px;">Data: ${formatarDataCurta(periodoData)}</p>`;
    } else if (periodoInicio) {
        periodoHtml = `<p style="font-size: 9pt; color: #555; margin-bottom: 8px;">Período: ${formatarDataCurta(periodoInicio)} a ${formatarDataCurta(periodoFim)}</p>`;
    }

    let itensHtml = '';
    servicos.forEach((s, i) => {
        if (s.desc || s.valor) {
            itensHtml += `<tr><td style="padding: 3px 6px; border-bottom: 1px solid #eee; font-size: 9pt;">${s.desc || 'Item'}</td><td style="padding: 3px 6px; text-align: center; font-size: 9pt;">${s.qtd || 1}x</td><td style="padding: 3px 6px; text-align: right; font-size: 9pt;">${formatarParaMoeda((s.qtd || 1) * (s.valor || 0))}</td></tr>`;
        }
    });

    preview.innerHTML = `
        <div style="width: 100%; text-align: left; padding: 15px; font-family: Roboto, Arial, sans-serif; font-size: 10pt;">
            <div style="text-align: center; font-size: 14pt; font-weight: bold; color: #2c3e50; border-bottom: 2px solid #333; padding-bottom: 8px; margin-bottom: 12px;">RECIBO DE PRESTAÇÃO DE SERVIÇOS</div>
            <div style="display: flex; gap: 20px; margin-bottom: 12px;">
                <div style="flex: 1;">
                    <p style="font-weight: 700; font-size: 10pt; color: #34495e; margin-bottom: 4px;">RECEBEDOR (PRESTADOR)</p>
                    <p style="font-size: 10pt; margin: 2px 0;">${recebedorNome || '...'}</p>
                    <p style="font-size: 9pt; color: #555; margin: 1px 0;">${recebedorDoc || ''}</p>
                    <p style="font-size: 9pt; color: #555; margin: 1px 0;">${recebedorRua ? `${recebedorRua}, ${recebedorNum}` : ''}</p>
                    <p style="font-size: 9pt; color: #555; margin: 1px 0;">${recebedorCidade ? `${recebedorCidade}${recebedorUf ? ` - ${recebedorUf}` : ''}` : ''}</p>
                </div>
                <div style="flex: 1;">
                    <p style="font-weight: 700; font-size: 10pt; color: #34495e; margin-bottom: 4px;">PAGADOR (CLIENTE)</p>
                    <p style="font-size: 10pt; margin: 2px 0;">${pagadorNome || '...'}</p>
                </div>
            </div>
            ${periodoHtml}
            ${itensHtml ? `<table style="width: 100%; border-collapse: collapse; margin-bottom: 12px;"><tr style="background: #34495e; color: #fff;"><th style="padding: 4px 6px; text-align: left; font-size: 9pt;">Descrição</th><th style="padding: 4px 6px; text-align: center; font-size: 9pt;">Qtd</th><th style="padding: 4px 6px; text-align: right; font-size: 9pt;">Subtotal</th></tr>${itensHtml}</table>` : ''}
            ${observacoes ? `<p style="font-size: 9pt; color: #555; margin-bottom: 8px; font-style: italic;">Obs: ${observacoes}</p>` : ''}
            <hr style="margin: 10px 0;">
            <div style="text-align: right; font-size: 14pt; font-weight: bold; color: #27ae60;">Total: ${total}</div>
        </div>
    `;
}

function salvarRecibo() {
    const periodoTipo = document.getElementById('periodo-tipo').value;
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
        servicos: servicos,
        periodo: {
            tipo: periodoTipo,
            inicio: periodoTipo === 'data' ? '' : document.getElementById('periodo-inicio').value,
            fim: periodoTipo === 'data' ? '' : document.getElementById('periodo-fim').value,
            data: periodoTipo === 'data' ? document.getElementById('periodo-data').value : '',
        },
        observacoes: document.getElementById('observacoes').value,
    };
    const reciboSalvo = {
        nome: (formData.recebedor.nome || 'Recibo Sem Nome') + ' (' + new Date().toLocaleDateString('pt-BR') + ')',
        data: formData
    };
    const result = storageAdd(STORAGE_KEY, reciboSalvo);
    if (result) {
        showToast('Modelo salvo com sucesso!', 'success');
        renderizarRecibosSalvos();
    }
}

function renderizarRecibosSalvos() {
    const lista = document.getElementById('lista-recibos-salvos');
    const recibos = storageGet(STORAGE_KEY);
    if (recibos.length === 0) {
        lista.innerHTML = '<p style="color: var(--text-light); text-align: center; padding: 10px;">Nenhum recibo salvo.</p>';
        return;
    }
    lista.innerHTML = '';
    recibos.forEach((recibo) => {
        const item = document.createElement('div');
        item.className = 'saved-item animate-fade-in';
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
    const recibo = storageFind(STORAGE_KEY, id);
    if (!recibo) return;
    const formData = recibo.data;
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
    document.getElementById('periodo-tipo').value = formData.periodo.tipo || 'data';
    document.getElementById('periodo-inicio').value = formData.periodo.inicio || '';
    document.getElementById('periodo-fim').value = formData.periodo.fim || '';
    document.getElementById('periodo-data').value = formData.periodo.data || '';
    document.getElementById('observacoes').value = formData.observacoes || '';
    servicos = formData.servicos || [];
    togglePeriodoRecibo();
    renderizarServicos();
    calcularTotal();
    atualizarPrevia();
    showToast('Modelo carregado!', 'success');
}

async function excluirRecibo(id) {
    if (!await showConfirmModal('Tem certeza que deseja excluir este modelo?')) return;
    storageRemove(STORAGE_KEY, id);
    showToast('Modelo excluído.', 'info');
    renderizarRecibosSalvos();
}

async function limparFormulario() {
    if (!await showConfirmModal('Limpar todos os campos do formulário?')) return;
    const inputs = document.querySelectorAll('.form-section input[type="text"], .form-section input[type="tel"], .form-section input[type="date"]');
    inputs.forEach(i => { i.value = ''; i.classList.remove('input-error', 'input-success'); });
    document.getElementById('observacoes').value = '';
    servicos = [];
    renderizarServicos();
    calcularTotal();
    atualizarPrevia();
    const hoje = hojeISO();
    document.getElementById('periodo-inicio').value = hoje;
    document.getElementById('periodo-fim').value = hoje;
    document.getElementById('periodo-data').value = hoje;
    showToast('Formulário limpo.', 'info');
}

function gerarPDF() {
    const nomeRecebedor = document.getElementById('recebedor-nome').value.trim();
    if (!nomeRecebedor) {
        showToast('Informe ao menos o nome do Recebedor.', 'warning');
        return;
    }
    if (servicos.length === 0) {
        showToast('Adicione pelo menos um serviço.', 'warning');
        return;
    }

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
    const periodoInicio = periodoTipo === 'data' ? '' : formatarDataExtenso(document.getElementById('periodo-inicio').value);
    const periodoFim = periodoTipo === 'data' ? '' : formatarDataExtenso(document.getElementById('periodo-fim').value);
    const periodoData = periodoTipo === 'data' ? formatarDataExtenso(document.getElementById('periodo-data').value) : '';
    const observacoes = document.getElementById('observacoes').value;
    const total = document.getElementById('total-amount').innerText;

    const corpoTabela = [
        [{ text: 'Descrição', style: 'tableHeader' }, { text: 'Qtd.', style: 'tableHeader' }, { text: 'Valor Unit.', style: 'tableHeader' }, { text: 'Subtotal', style: 'tableHeader' }]
    ];
    servicos.forEach(item => {
        corpoTabela.push([
            item.desc || 'Item não descrito',
            (item.qtd || 0).toString(),
            formatarParaMoeda(item.valor || 0),
            { text: formatarParaMoeda((item.qtd || 0) * (item.valor || 0)), alignment: 'right' }
        ]);
    });

    const docDefinition = {
        pageSize: 'A4', pageMargins: [40, 60, 40, 60],
        header: { text: 'RECIBO DE PRESTAÇÃO DE SERVIÇOS', style: 'header', alignment: 'center', margin: [0, 20, 0, 20] },
        footer: function (currentPage, pageCount) {
            return { text: `Página ${currentPage.toString()} de ${pageCount}`, alignment: 'center', style: 'footer' };
        },
        content: [
            {
                columns: [
                    { width: '50%', text: [
                        { text: 'RECEBEDOR (PRESTADOR)\n', style: 'subheader' },
                        { text: `${recebedor.nome}\n` }, { text: `Doc.: ${recebedor.doc}\n` }, { text: `Tel.: ${recebedor.tel}\n\n` },
                        { text: `Endereço:\n`, bold: true }, { text: `${recebedor.rua}, ${recebedor.num} ${recebedor.comp ? '(' + recebedor.comp + ')' : ''}\n` },
                        { text: `${recebedor.cidade} - ${recebedor.uf}\n` }, { text: `CEP: ${recebedor.cep}` }
                    ], style: 'infoBox' },
                    { width: '50%', text: [
                        { text: 'PAGADOR (CLIENTE)\n', style: 'subheader' },
                        { text: `${pagador.nome}\n` }, { text: `Doc.: ${pagador.doc}\n` }, { text: `Tel.: ${pagador.tel}\n\n` },
                        { text: `Endereço:\n`, bold: true }, { text: `${pagador.rua || '...'}, ${pagador.num || '...'} ${pagador.comp ? '(' + pagador.comp + ')' : ''}\n` },
                        { text: `${pagador.cidade || '...'} - ${pagador.uf || '...'}\n` }, { text: `CEP: ${pagador.cep || '...'}` }
                    ], style: 'infoBox' }
                ], columnGap: 20
            },
            periodoTipo === 'data'
                ? { text: [{ text: 'Data da Prestação:\n', style: 'subheader', margin: [0, 20, 0, 5] }, { text: periodoData, alignment: 'center' }], margin: [0, 10, 0, 10] }
                : { text: [{ text: 'Período da Prestação (Referente a ' + periodoTipo + '):\n', style: 'subheader', margin: [0, 20, 0, 5] }, { text: `De ${periodoInicio} até ${periodoFim}`, alignment: 'center' }], margin: [0, 10, 0, 10] },
            ...(observacoes ? [{ text: [{ text: 'Observações:\n', bold: true }, observacoes], fontSize: 10, margin: [0, 5, 0, 10] }] : []),
            { text: 'ITENS/SERVIÇOS PRESTADOS', style: 'subheader', margin: [0, 15, 0, 5] },
            { table: { headerRows: 1, widths: ['*', 'auto', 'auto', 'auto'], body: corpoTabela }, layout: 'lightHorizontalLines' },
            { text: `TOTAL: ${total}`, style: 'total', alignment: 'right', margin: [0, 10, 0, 30] },
            { text: [
                'Declaro que recebi da parte pagadora identificada acima, a importância de ',
                { text: total, bold: true },
                ' referente aos produtos/serviços detalhados neste documento. Este recibo quita integralmente os valores descritos.'
            ], style: 'paragraph', alignment: 'justify', margin: [0, 20, 0, 20] },
            { text: `${recebedor.cidade}, ${new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}.`, alignment: 'center', margin: [0, 30, 0, 30] },
            { text: '________________________________________', alignment: 'center', margin: [0, 20, 0, 5] },
            { text: recebedor.nome, alignment: 'center' },
            { text: recebedor.doc, alignment: 'center', style: 'assinaturaDoc' }
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
        defaultStyle: { font: 'Roboto' }
    };

    const dataArquivo = periodoTipo === 'data' ? periodoData.replace(/\//g, '-') : periodoFim.replace(/\//g, '-');
    pdfMake.createPdf(docDefinition).download(`Recibo_${recebedor.nome.split(' ')[0]}_${dataArquivo}.pdf`);
    showToast('PDF gerado com sucesso!', 'success');
}
