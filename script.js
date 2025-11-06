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
    // Não limpa o valor, apenas formata o que está lá
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
    // Não limpa o valor, apenas formata o que está lá
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
                // Não alertamos, apenas logamos, para não interromper a UX
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
            document.getElementById(tipo + '-nome').value = data.razao_social || '';
            document.getElementById(tipo + '-rua').value = data.logradouro || '';
            document.getElementById(tipo + '-num').value = data.numero || '';
            document.getElementById(tipo + '-comp').value = data.complemento || '';
            document.getElementById(tipo + '-cep').value = data.cep ? formatarCEP({ value: data.cep }) : '';
            document.getElementById(tipo + '-cidade').value = data.municipio || '';
            document.getElementById(tipo + '-uf').value = data.uf || '';
            document.getElementById(tipo + '-tel').value = data.ddd_telefone_1 ? formatarTelefone({ value: data.ddd_telefone_1 }) : '';
            
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
                    <label>Preço UNIT:</label>
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

    const recebedorEnd = [
        document.getElementById('recebedor-rua').value,
        document.getElementById('recebedor-num').value,
        document.getElementById('recebedor-comp').value,
        document.getElementById('recebedor-cidade').value,
        document.getElementById('recebedor-uf').value
    ].filter(Boolean).join(', ');

    const pagadorEnd = [
        document.getElementById('pagador-rua').value,
        document.getElementById('pagador-num').value,
        document.getElementById('pagador-comp').value,
        document.getElementById('pagador-cidade').value,
        document.getElementById('pagador-uf').value
    ].filter(Boolean).join(', ');

    const periodoTipo = document.getElementById('periodo-tipo').options[document.getElementById('periodo-tipo').selectedIndex].text;
    const dataInicio = document.getElementById('periodo-inicio').value;
    const dataFim = document.getElementById('periodo-fim').value;
    let textoPeriodo = '';
    if (dataInicio && dataFim) {
        // Formata as datas para o preview
        const formatarData = (data) => data.split('-').reverse().join('/');
        textoPeriodo = `${periodoTipo} de ${formatarData(dataInicio)} a ${formatarData(dataFim)}`;
    }

    let html = `
        <div class="preview-header">
            <div class="preview-title">RECIBO DE PAGAMENTO</div>
            <div style="font-size: 14px; color: #7f8c8d;">**VALOR: ${formatarMoeda(total)}**</div>
        </div>

        <div class="preview-section">
            <h3>RECEBEDOR (Prestador de Serviço)</h3>
            <div class="preview-content">
                <div class="preview-row">
                    <div class="preview-label">${recebedorType === 'pf' ? 'Nome' : 'Razão Social'}:</div>
                    <div class="preview-value">${document.getElementById('recebedor-nome').value || '—'}</div>
                </div>
                <div class="preview-row">
                    <div class="preview-label">${recebedorType === 'pf' ? 'CPF' : 'CNPJ'}:</div>
                    <div class="preview-value">${document.getElementById('recebedor-doc').value || '—'}</div>
                </div>
                ${recebedorEnd ? `<div class="preview-row"><div class="preview-label">Endereço:</div><div class="preview-value">${recebedorEnd}</div></div>` : ''}
                <div class="preview-row">
                    <div class="preview-label">Telefone:</div>
                    <div class="preview-value">${document.getElementById('recebedor-tel').value || '—'}</div>
                </div>
            </div>
        </div>

        <div class="preview-section">
            <h3>PAGADOR (Cliente)</h3>
            <div class="preview-content">
                <div class="preview-row">
                    <div class="preview-label">${pagadorType === 'pf' ? 'Nome' : 'Razão Social'}:</div>
                    <div class="preview-value">${document.getElementById('pagador-nome').value || '—'}</div>
                </div>
                ${document.getElementById('pagador-doc').value ? `
                    <div class="preview-row">
                        <div class="preview-label">${pagadorType === 'pf' ? 'CPF' : 'CNPJ'}:</div>
                        <div class="preview-value">${document.getElementById('pagador-doc').value}</div>
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
                            <th>Descrição</th>
                            <th style="text-align: center; width: 50px;">Qtd</th>
                            <th style="text-align: right; width: 80px;">Preço Unit.</th>
                            <th style="text-align: right; width: 80px;">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${servicos.map(s => `
                            <tr>
                                <td>${s.descricao || 'N/D'}</td>
                                <td style="text-align: center;">${s.quantidade}</td>
                                <td style="text-align: right;">${formatarMoeda(s.preco)}</td>
                                <td style="text-align: right;">${formatarMoeda(s.quantidade * s.preco)}</td>
                            </tr>
                        `).join('')}
                        <tr style="background: #ecf0f1;">
                            <td style="font-weight: bold; color: #2c3e50;" colspan="3">TOTAL FINAL</td>
                            <td style="text-align: right; font-weight: bold; color: #2c3e50;">${formatarMoeda(total)}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        ` : ''}
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

// --- FUNÇÃO DE GERAR PDF CORRIGIDA E MELHORADA ---
function gerarPDF() {
    if (!validarFormulario()) return;

    try {
        // Inicializar o jsPDF
        // Configurações para um layout mais limpo e fonte padrão.
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF('p', 'mm', 'a4');
        
        // Constantes de Layout
        const margin = 15;
        const docWidth = doc.internal.pageSize.getWidth();
        let y = margin;
        const lineHeight = 5;
        
        // Cores neutras e profissionais
        const primaryColor = [52, 73, 94]; // Azul Escuro/Cinza
        const secondaryColor = [236, 240, 241]; // Cinza muito claro
        const textColor = [44, 62, 80]; // Quase preto

        // --- Dados do Formulário ---
        const recebedorNome = document.getElementById('recebedor-nome').value;
        const pagadorNome = document.getElementById('pagador-nome').value || 'PAGADOR';
        const totalGeral = calcularTotal();

        // Endereço formatado (completo)
        const formatarEndereco = (tipo) => {
            const rua = document.getElementById(tipo + '-rua').value;
            const num = document.getElementById(tipo + '-num').value;
            const comp = document.getElementById(tipo + '-comp').value;
            const cidade = document.getElementById(tipo + '-cidade').value;
            const uf = document.getElementById(tipo + '-uf').value;
            const cep = document.getElementById(tipo + '-cep').value;

            const linha1 = [rua, num].filter(Boolean).join(', ') + (comp ? ` - ${comp}` : '');
            const linha2 = [cidade, uf].filter(Boolean).join('/');
            const linha3 = cep;
            
            return [linha1, linha2, linha3].filter(Boolean);
        };

        const recebedorEnd = formatarEndereco('recebedor');
        const pagadorEnd = formatarEndereco('pagador');

        // Período
        const periodoTipo = document.getElementById('periodo-tipo').options[document.getElementById('periodo-tipo').selectedIndex].text;
        const dataInicioInput = document.getElementById('periodo-inicio').value;
        const dataFimInput = document.getElementById('periodo-fim').value;
        const formatarDataPDF = (data) => new Date(data + 'T03:00:00').toLocaleDateString('pt-BR');
        const textoPeriodicidade = `${periodoTipo} de ${formatarDataPDF(dataInicioInput)} a ${formatarDataPDF(dataFimInput)}`;

        // --- Título e Cabeçalho ---
        doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.setFontSize(28);
        doc.setFont("helvetica", "bold");
        doc.text("R E C I B O", docWidth / 2, y, { align: "center" });
        y += 10;
        
        doc.setFontSize(14);
        doc.setFont("helvetica", "normal");
        doc.text(`Valor Total: ${formatarMoeda(totalGeral)}`, docWidth / 2, y, { align: "center" });
        y += 15;

        // --- Bloco Recebedor ---
        y = drawSectionHeader(doc, "RECEBEDOR (Prestador de Serviço)", y, margin, docWidth, primaryColor, textColor);
        y += 2;
        y = drawInfoBlock(doc, y, margin, lineHeight, textColor, [
            [`${recebedorType === 'pf' ? 'Nome' : 'Razão Social'}:`, document.getElementById('recebedor-nome').value],
            [`${recebedorType === 'pf' ? 'CPF' : 'CNPJ'}:`, document.getElementById('recebedor-doc').value],
            ["Telefone:", document.getElementById('recebedor-tel').value],
            ...recebedorEnd.map(l => ["Endereço:", l])
        ]);
        y += 5;

        // --- Bloco Pagador ---
        y = drawSectionHeader(doc, "PAGADOR (Cliente)", y, margin, docWidth, primaryColor, textColor);
        y += 2;
        y = drawInfoBlock(doc, y, margin, lineHeight, textColor, [
            [`${pagadorType === 'pf' ? 'Nome' : 'Razão Social'}:`, document.getElementById('pagador-nome').value],
            [`${pagadorType === 'pf' ? 'CPF' : 'CNPJ'}:`, document.getElementById('pagador-doc').value],
            ["Telefone:", document.getElementById('pagador-tel').value],
            ...pagadorEnd.map(l => ["Endereço:", l])
        ]);
        y += 5;

        // --- Bloco Período ---
        y = drawSectionHeader(doc, "PERÍODO DE PRESTAÇÃO", y, margin, docWidth, primaryColor, textColor);
        y += 2;
        y = drawInfoBlock(doc, y, margin, lineHeight, textColor, [
            ["Referente a:", textoPeriodicidade]
        ]);
        y += 5;


        // --- Tabela de Serviços (Usando autoTable) ---
        if (servicos.length > 0) {
            y = drawSectionHeader(doc, "DISCRIMINAÇÃO DOS SERVIÇOS/PRODUTOS", y, margin, docWidth, primaryColor, textColor);
            y += 2;
            
            const tableHeaders = [
                { title: "Descrição", dataKey: "descricao" },
                { title: "Qtd", dataKey: "quantidade" },
                { title: "Preço Unit.", dataKey: "preco" },
                { title: "Total", dataKey: "total" }
            ];

            const tableData = servicos.map(s => ({
                descricao: s.descricao || 'N/D',
                quantidade: s.quantidade.toString(),
                preco: formatarMoeda(s.preco),
                total: formatarMoeda(s.quantidade * s.preco)
            }));
            
            // Adiciona a linha do Total
            const totalRow = {
                descricao: { content: "TOTAL FINAL", colSpan: 3, styles: { fontStyle: 'bold', halign: 'right', fillColor: secondaryColor } },
                total: { content: formatarMoeda(totalGeral), styles: { fontStyle: 'bold', fillColor: secondaryColor, textColor: primaryColor } }
            };

            // Estilo da Tabela
            doc.autoTable({
                startY: y,
                head: [tableHeaders.map(h => h.title)],
                body: [...tableData.map(d => [d.descricao, d.quantidade, d.preco, d.total]), totalRow],
                theme: 'striped',
                margin: { top: 0, left: margin, right: margin, bottom: 0 },
                styles: { 
                    fontSize: 10, 
                    cellPadding: 2, 
                    textColor: textColor,
                    lineColor: [189, 195, 199], // Cinza
                    lineWidth: 0.1 
                },
                headStyles: {
                    fillColor: primaryColor,
                    textColor: 255,
                    fontStyle: 'bold',
                },
                columnStyles: {
                    0: { cellWidth: docWidth - (margin * 2) - 100 }, // Descrição
                    1: { halign: 'center', cellWidth: 20 }, // Qtd
                    2: { halign: 'right', cellWidth: 40 }, // Preço Unit.
                    3: { halign: 'right', cellWidth: 40 } // Total
                },
                didDrawPage: (data) => {
                    y = data.cursor.y; // Atualiza a posição Y após a tabela
                }
            });
            y += 5;
        }

        // --- Assinaturas ---
        const signatureY = doc.internal.pageSize.getHeight() - 40;
        const sigWidth = 60;
        const sigGap = 30; // Espaço entre as assinaturas
        const sigLeftX = margin + (docWidth - (2 * sigWidth) - sigGap) / 2;
        const sigRightX = sigLeftX + sigWidth + sigGap;

        // Assinatura do Recebedor
        doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.line(sigLeftX, signatureY, sigLeftX + sigWidth, signatureY);
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(textColor[0], textColor[1], textColor[2]);
        doc.text(recebedorNome, sigLeftX + sigWidth / 2, signatureY + 5, { align: "center", maxWidth: sigWidth });
        doc.setFontSize(9);
        doc.setTextColor(127, 140, 141); // Cinza
        doc.text("Recebedor (Prestador)", sigLeftX + sigWidth / 2, signatureY + 10, { align: "center" });

        // Assinatura do Pagador
        doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.line(sigRightX, signatureY, sigRightX + sigWidth, signatureY);
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(textColor[0], textColor[1], textColor[2]);
        doc.text(pagadorNome, sigRightX + sigWidth / 2, signatureY + 5, { align: "center", maxWidth: sigWidth });
        doc.setFontSize(9);
        doc.setTextColor(127, 140, 141);
        doc.text("Pagador (Cliente)", sigRightX + sigWidth / 2, signatureY + 10, { align: "center" });

        // Data de Emissão (Rodapé)
        const hoje = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
        doc.setFontSize(9);
        doc.setFont("helvetica", "italic");
        doc.setTextColor(127, 140, 141);
        doc.text(`Recibo gerado em: ${hoje}`, docWidth - margin, doc.internal.pageSize.getHeight() - 5, { align: "right" });

        // Salvar o PDF
        const fileName = `recibo_${recebedorNome.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().slice(0,10)}.pdf`;
        doc.save(fileName);

    } catch (error) {
        console.error('Erro fatal ao gerar PDF:', error);
        alert('Erro ao gerar PDF. Verifique o console para mais detalhes.');
    }
}

// Funções auxiliares para o PDF (mantidas e adaptadas para o novo estilo)
function drawSectionHeader(doc, text, y, margin, docWidth, primaryColor, textColor) {
    // Linha cinza clara de divisão
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, y, docWidth - margin, y);
    y += 4; 
    
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text(text.toUpperCase(), margin, y);
    
    y += 2;
    // Linha cinza escura de ênfase
    doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setLineWidth(0.5);
    doc.line(margin, y, docWidth - margin, y);
    doc.setLineWidth(0.2); // Reseta a espessura da linha
    
    return y + 3;
}

function drawInfoBlock(doc, y, margin, lineHeight, textColor, data) {
    const labelWidth = 30; // Largura para o label, ajustada para caber mais
    doc.setFontSize(10);
    doc.setTextColor(textColor[0], textColor[1], textColor[2]);

    data.forEach(([label, value]) => {
        if (value && value.trim() !== "") {
            // Verifica se a linha atual + o texto caberá na página
            if (y + lineHeight > doc.internal.pageSize.getHeight() - 50) {
                doc.addPage();
                y = margin;
                doc.setFontSize(10); // Garante o tamanho da fonte após a nova página
            }

            doc.setFont("helvetica", "bold");
            // Posiciona o label na margem esquerda
            doc.text(label, margin, y); 
            
            doc.setFont("helvetica", "normal");
            // Quebra de texto se for muito longo, começando após o espaço do label
            const lines = doc.splitTextToSize(value, doc.internal.pageSize.getWidth() - margin * 2 - labelWidth);
            doc.text(lines, margin + labelWidth, y);
            
            y += lines.length * lineHeight; // Avança Y pelo número de linhas
        }
    });
    return y;
}


// --- FUNÇÕES CRUD (Salvar, Carregar, Remover) --- (Sem alterações, apenas migrada)
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
    const salvos = localStorage.getItem('recibosGerador');
    if (salvos) {
        recibosSalvos = JSON.parse(salvos);
    }
    // Inicializa o tipo de documento PF para ambos
    setRecebedorType('pf'); 
    setPagadorType('pf');
    
    renderRecibosSalvos();
    renderizarServicos();
    atualizarPrevia();
}

window.onload = init;