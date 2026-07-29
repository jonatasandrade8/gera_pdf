/* checklist.js - Checklists & Planner Semanal (Simplificado) */

const STORAGE_KEY = 'checklists_planner_v2';
let itens = [];
let ativoId = null;
let modo = 'checklist';
let draggedItem = null;
let draggedDia = null;

const DIAS_SEMANA = [
    { key: 'dom', nome: 'Domingo' },
    { key: 'seg', nome: 'Segunda' },
    { key: 'ter', nome: 'Terça' },
    { key: 'qua', nome: 'Quarta' },
    { key: 'qui', nome: 'Quinta' },
    { key: 'sex', nome: 'Sexta' },
    { key: 'sab', nome: 'Sábado' }
];

document.addEventListener('DOMContentLoaded', () => {
    itens = storageGet(STORAGE_KEY);
    renderSidebar();
    if (itens.length > 0) selecionarItem(itens[0].id);
    else mostrarVazio();
});

function salvar() { storageSet(STORAGE_KEY, itens); }
function getAtivo() { return itens.find(i => i.id === ativoId); }
function fecharModal(id) { document.getElementById(id).classList.remove('active'); }
function mostrarVazio() {
    const icon = modo === 'checklist' ? '📋' : '📅';
    const msg = modo === 'checklist' ? 'Crie ou selecione um checklist' : 'Crie ou selecione um planner';
    document.getElementById('conteudoPrincipal').innerHTML = `<div style="text-align: center; padding: 60px 20px; color: var(--text-muted);"><p style="font-size: 3rem; margin-bottom: 15px;">${icon}</p><p style="font-size: 1.2rem;">${msg}</p></div>`;
}

// === MODO ===

function setMode(m) {
    modo = m;
    document.getElementById('btnModeChecklist').classList.toggle('active', m === 'checklist');
    document.getElementById('btnModePlanner').classList.toggle('active', m === 'planner');
    document.getElementById('sidebarTitle').textContent = m === 'checklist' ? '📋 Meus Checklists' : '📅 Meus Planners';
    document.getElementById('btnNovo').textContent = m === 'checklist' ? '+ Novo Checklist' : '+ Novo Planner';
    if (ativoId) {
        const ativo = getAtivo();
        if (ativo && ativo.tipo !== m) { ativoId = null; mostrarVazio(); }
        else if (ativo) renderConteudo();
    } else {
        mostrarVazio();
    }
    renderSidebar();
}

// === CRIAR / DELETAR ===

function criarNovo() {
    document.getElementById('novoNome').value = '';
    document.getElementById('modalNovoTitulo').textContent = modo === 'checklist' ? 'Novo Checklist' : 'Novo Planner';
    document.getElementById('novoNome').placeholder = modo === 'checklist' ? 'Ex: Preflight, Checklist de Viagem...' : 'Ex: Semana 20-26 Maio';
    document.getElementById('modalNovo').classList.add('active');
    setTimeout(() => document.getElementById('novoNome').focus(), 100);
}

function salvarNovo() {
    const nome = document.getElementById('novoNome').value.trim();
    if (!nome) { showToast('Digite um nome.', 'warning'); return; }
    const novo = { id: gerarId(), nome: nome, tipo: modo };
    if (modo === 'checklist') {
        novo.itens = [];
    } else {
        novo.dias = {};
        DIAS_SEMANA.forEach(d => { novo.dias[d.key] = []; });
    }
    itens.push(novo);
    salvar();
    fecharModal('modalNovo');
    selecionarItem(novo.id);
    renderSidebar();
    showToast(`${modo === 'checklist' ? 'Checklist' : 'Planner'} "${nome}" criado!`, 'success');
}

async function deletarItem(id, e) {
    e.stopPropagation();
    const item = itens.find(i => i.id === id);
    if (!await showConfirmModal(`Excluir "${item.nome}"?`)) return;
    itens = itens.filter(i => i.id !== id);
    salvar();
    if (ativoId === id) {
        ativoId = null;
        mostrarVazio();
    }
    renderSidebar();
    showToast('Excluído.', 'info');
}

// === SIDEBAR ===

function renderSidebar() {
    const lista = document.getElementById('listaItens');
    const filtrados = itens.filter(i => i.tipo === modo);
    lista.innerHTML = '';
    if (filtrados.length === 0) {
        lista.innerHTML = `<p style="color: var(--text-muted); text-align: center; padding: 15px; font-size: 0.9rem;">Nenhum ${modo === 'checklist' ? 'checklist' : 'planner'} criado.</p>`;
        return;
    }
    filtrados.forEach(item => {
        const li = document.createElement('li');
        li.className = `checklist-list-item ${item.id === ativoId ? 'active' : ''}`;
        li.onclick = () => selecionarItem(item.id);
        const count = item.tipo === 'checklist' ? item.itens.length : Object.values(item.dias || {}).reduce((s, d) => s + d.length, 0);
        li.innerHTML = `
            <div style="flex: 1;">
                <div style="font-weight: 600; display: flex; align-items: center; gap: 6px;">
                    ${item.nome}
                    <span class="sidebar-item-type ${item.tipo === 'checklist' ? 'sidebar-type-checklist' : 'sidebar-type-planner'}">${item.tipo === 'checklist' ? 'CK' : 'PL'}</span>
                </div>
                <div style="font-size: 0.75rem; color: var(--text-muted);">${count} ${count === 1 ? 'item' : 'itens'}</div>
            </div>
            <button class="delete-checklist" onclick="deletarItem('${item.id}', event)" title="Excluir">🗑️</button>
        `;
        lista.appendChild(li);
    });
}

function selecionarItem(id) {
    ativoId = id;
    renderSidebar();
    renderConteudo();
}

// === CHECKLIST ===

function adicionarItemChecklist(nome) {
    if (!nome.trim()) return;
    const cl = getAtivo();
    cl.itens.push({ id: gerarId(), nome: nome.trim(), checked: false });
    salvar();
    renderConteudo();
    renderSidebar();
}

function toggleChecklistItem(itemId) {
    const cl = getAtivo();
    const item = cl.itens.find(i => i.id === itemId);
    item.checked = !item.checked;
    salvar();
    renderConteudo();
}

function deletarChecklistItem(itemId) {
    const cl = getAtivo();
    cl.itens = cl.itens.filter(i => i.id !== itemId);
    salvar();
    renderConteudo();
    renderSidebar();
}

// === PLANNER ===

function adicionarItemPlanner(diaKey, nome, horario) {
    if (!nome.trim()) return;
    const pl = getAtivo();
    pl.dias[diaKey].push({ id: gerarId(), nome: nome.trim(), horario: horario || '' });
    salvar();
    renderConteudo();
    renderSidebar();
}

function deletarPlannerItem(diaKey, itemId) {
    const pl = getAtivo();
    pl.dias[diaKey] = pl.dias[diaKey].filter(i => i.id !== itemId);
    salvar();
    renderConteudo();
    renderSidebar();
}

// === DRAG & DROP ===

function onDragStart(e, itemId) {
    draggedItem = itemId;
    draggedDia = null;
    e.target.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
}

function onDragStartPlanner(e, diaKey, itemId) {
    draggedItem = itemId;
    draggedDia = diaKey;
    e.target.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
}

function onDragEnd(e) {
    e.target.classList.remove('dragging');
    document.querySelectorAll('.item-row').forEach(r => r.classList.remove('drag-over'));
    draggedItem = null;
    draggedDia = null;
}

function onDragOver(e) { e.preventDefault(); e.target.closest('.item-row')?.classList.add('drag-over'); }
function onDragLeave(e) { e.target.closest('.item-row')?.classList.remove('drag-over'); }

function onDropChecklist(e, targetId) {
    e.preventDefault();
    e.target.closest('.item-row')?.classList.remove('drag-over');
    if (!draggedItem || draggedItem === targetId) return;
    const cl = getAtivo();
    const from = cl.itens.findIndex(i => i.id === draggedItem);
    const to = cl.itens.findIndex(i => i.id === targetId);
    const [moved] = cl.itens.splice(from, 1);
    cl.itens.splice(to, 0, moved);
    salvar();
    renderConteudo();
}

function onDropPlanner(e, diaKey, targetId) {
    e.preventDefault();
    e.target.closest('.item-row')?.classList.remove('drag-over');
    if (!draggedItem) return;
    const pl = getAtivo();
    const sourceDia = draggedDia || diaKey;
    const fromIdx = pl.dias[sourceDia].findIndex(i => i.id === draggedItem);
    if (fromIdx === -1) return;
    const toIdx = pl.dias[diaKey].findIndex(i => i.id === targetId);
    const [moved] = pl.dias[sourceDia].splice(fromIdx, 1);
    pl.dias[diaKey].splice(toIdx === -1 ? pl.dias[diaKey].length : toIdx, 0, moved);
    salvar();
    draggedItem = null;
    draggedDia = null;
    renderConteudo();
}

// === RENDERIZAÇÃO ===

function renderConteudo() {
    const ativo = getAtivo();
    if (!ativo) return;
    if (ativo.tipo === 'checklist') renderChecklistView(ativo);
    else renderPlannerView(ativo);
}

function renderChecklistView(cl) {
    const container = document.getElementById('conteudoPrincipal');
    const total = cl.itens.length;
    const checked = cl.itens.filter(i => i.checked).length;

    container.innerHTML = `
        <h2 style="margin-bottom: 15px;">📋 ${cl.nome}</h2>
        <div style="display: flex; gap: 6px; margin-bottom: 15px;" class="add-item-inline">
            <input type="text" id="novoItemInput" placeholder="Nome do item..." onkeydown="if(event.key==='Enter'){ adicionarItemChecklist(this.value); this.value=''; }">
            <button onclick="adicionarItemChecklist(document.getElementById('novoItemInput').value); document.getElementById('novoItemInput').value='';">+</button>
        </div>
        <div id="checklistItems">
    `;

    if (total === 0) {
        container.innerHTML += '<p style="text-align: center; color: var(--text-muted); padding: 30px;">Nenhum item. Adicione acima.</p>';
    } else {
        cl.itens.forEach(item => {
            container.innerHTML += `
                <div class="item-row ${item.checked ? 'checklist-item-checked' : ''}" draggable="true" ondragstart="onDragStart(event, '${item.id}')" ondragend="onDragEnd(event)" ondragover="onDragOver(event)" ondragleave="onDragLeave(event)" ondrop="onDropChecklist(event, '${item.id}')">
                    <span class="drag-handle" title="Arrastar">⠿</span>
                    <input type="checkbox" class="item-check" ${item.checked ? 'checked' : ''} onchange="toggleChecklistItem('${item.id}')">
                    <span class="item-name">${item.nome}</span>
                    <button class="item-delete" onclick="deletarChecklistItem('${item.id}')" title="Remover">✕</button>
                </div>
            `;
        });
    }

    container.innerHTML += `</div>
        <div class="pdf-actions">
            <button class="btn btn-secondary" onclick="gerarPDFChecklist()">📥 Gerar PDF Checklist</button>
        </div>
    `;

    setTimeout(() => document.getElementById('novoItemInput')?.focus(), 50);
}

function renderPlannerView(pl) {
    const container = document.getElementById('conteudoPrincipal');
    let html = `<h2 style="margin-bottom: 15px;">📅 ${pl.nome}</h2><div class="planner-grid">`;

    DIAS_SEMANA.forEach(dia => {
        const diaItens = pl.dias[dia.key] || [];
        html += `<div class="planner-day">
            <div class="planner-day-header">${dia.nome}</div>
            <div style="margin-bottom: 6px;">
                <input type="text" id="plannerInput_${dia.key}" placeholder="Ex: Reunião com cliente..." title="Digite a tarefa e pressione Enter" style="width: 100%; box-sizing: border-box; font-size: 0.9rem; padding: 8px 10px; margin-bottom: 4px;" onkeydown="if(event.key==='Enter'){ adicionarPlannerEnter('${dia.key}'); }">
                <div style="display: flex; gap: 4px;">
                    <input type="time" id="plannerTime_${dia.key}" style="flex: 1; min-width: 0; font-size: 0.8rem; padding: 6px 4px;">
                    <button onclick="adicionarPlannerEnter('${dia.key}')" style="padding: 6px 12px; font-size: 0.85rem; font-weight: 700; border: none; background: var(--accent-green); color: white; border-radius: var(--radius-sm); cursor: pointer;">+</button>
                </div>
            </div>
            <div id="plannerItems_${dia.key}">`;

        if (diaItens.length === 0) {
            html += '<p style="text-align: center; color: var(--text-muted); font-size: 0.8rem; padding: 10px 0;">Vazio</p>';
        } else {
            diaItens.forEach(item => {
                html += `
                    <div class="item-row" draggable="true" ondragstart="onDragStartPlanner(event, '${dia.key}', '${item.id}')" ondragend="onDragEnd(event)" ondragover="onDragOver(event)" ondragleave="onDragLeave(event)" ondrop="onDropPlanner(event, '${dia.key}', '${item.id}')">
                        <span class="drag-handle" title="Arrastar">⠿</span>
                        <span class="item-name">${item.nome}</span>
                        ${item.horario ? `<span class="item-time">${item.horario}</span>` : ''}
                        <button class="item-delete" onclick="deletarPlannerItem('${dia.key}', '${item.id}')" title="Remover">✕</button>
                    </div>
                `;
            });
        }

        html += '</div></div>';
    });

    html += `</div>
        <div class="pdf-actions">
            <button class="btn btn-secondary" onclick="gerarPDFPlanner()">📥 Gerar PDF Planner</button>
        </div>
    `;

    container.innerHTML = html;
}

function adicionarPlannerEnter(diaKey) {
    const input = document.getElementById(`plannerInput_${diaKey}`);
    const timeInput = document.getElementById(`plannerTime_${diaKey}`);
    if (!input.value.trim()) return;
    adicionarItemPlanner(diaKey, input.value, timeInput?.value || '');
}

// === PDF CHECKLIST ===

function gerarPDFChecklist() {
    const cl = getAtivo();
    if (!cl || cl.itens.length === 0) { showToast('Adicione pelo menos um item.', 'warning'); return; }

    const checkedCount = cl.itens.filter(i => i.checked).length;
    const totalCount = cl.itens.length;

    const headerRow = [
        { text: '#', style: 'tableHeader', alignment: 'center', width: 25 },
        { text: 'ITEM', style: 'tableHeader' },
        { text: '[  ]', style: 'tableHeader', alignment: 'center', width: 30 }
    ];

    const dataRows = cl.itens.map((item, i) => [
        { text: (i + 1).toString(), alignment: 'center', fontSize: 10, width: 25, color: '#888' },
        { text: item.nome, fontSize: 11, color: '#333' },
        { text: '[  ]', alignment: 'center', fontSize: 14, width: 30, color: '#555' }
    ]);

    const tableBody = [headerRow, ...dataRows];

    const docDefinition = {
        pageSize: 'A4', pageMargins: [35, 50, 35, 40],
        header: function () {
            return { text: cl.nome.toUpperCase(), style: 'header', alignment: 'center', margin: [0, 15, 0, 0] };
        },
        content: [
            {
                columns: [
                    { text: `Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, fontSize: 8, color: '#aaa' },
                    { text: `${totalCount} itens · ${checkedCount} concluídos`, fontSize: 8, color: '#aaa', alignment: 'right' }
                ],
                margin: [0, 0, 0, 12]
            },
            {
                table: { widths: [25, '*', 30], body: tableBody, headerRows: 1 },
                layout: {
                    hLineWidth: function (i, node) {
                        if (i === 0 || i === 1) return 1.5;
                        return i === node.table.body.length ? 1 : 0.4;
                    },
                    vLineWidth: function () { return 0.4; },
                    hLineColor: function () { return '#ddd'; },
                    vLineColor: function () { return '#e8e8e8'; },
                    paddingLeft: function (i) { return i === 1 ? 10 : 6; },
                    paddingRight: function () { return 6; },
                    paddingTop: function () { return 7; },
                    paddingBottom: function () { return 7; },
                    fillColor: function (rowIndex) {
                        if (rowIndex === 0) return '#2c3e50';
                        return rowIndex % 2 === 0 ? '#f5f6f8' : null;
                    }
                }
            },
            { text: '\n' },
            { text: 'Observações:', bold: true, fontSize: 11, margin: [0, 20, 0, 5], color: '#2c3e50' },
            { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 540, y2: 0, lineWidth: 0.5, lineColor: '#d0d0d0' }], margin: [0, 0, 0, 14] },
            { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 540, y2: 0, lineWidth: 0.5, lineColor: '#d0d0d0' }], margin: [0, 0, 0, 14] },
            { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 540, y2: 0, lineWidth: 0.5, lineColor: '#d0d0d0' }] },
            { text: 'Gerado por Checklists & Planner', fontSize: 7, color: '#ccc', alignment: 'center', margin: [0, 30, 0, 0] }
        ],
        styles: {
            header: { fontSize: 22, bold: true, color: '#2c3e50' },
            tableHeader: { color: '#fff', bold: true, fontSize: 9 }
        },
        defaultStyle: { font: 'Roboto' }
    };

    pdfMake.createPdf(docDefinition).download(`Checklist_${cl.nome.replace(/\s+/g, '_')}.pdf`);
    showToast('PDF gerado!', 'success');
}

// === PDF PLANNER ===

function gerarPDFPlanner() {
    const pl = getAtivo();
    if (!pl) { showToast('Selecione um planner.', 'warning'); return; }

    const totalItens = Object.values(pl.dias).reduce((s, d) => s + d.length, 0);
    if (totalItens === 0) { showToast('Adicione pelo menos um item.', 'warning'); return; }

    const colWidths = ['*', '*', '*', '*', '*', '*', '*'];
    const headerRow = DIAS_SEMANA.map(d => ({ text: d.nome.toUpperCase(), style: 'tableHeader', alignment: 'center', fontSize: 8 }));

    // Build rows - find max items in any day
    let maxItems = 0;
    DIAS_SEMANA.forEach(d => { if (pl.dias[d.key].length > maxItems) maxItems = pl.dias[d.key].length; });

    const bodyRows = [headerRow];
    for (let i = 0; i < Math.max(maxItems, 1); i++) {
        const row = DIAS_SEMANA.map(d => {
            const item = pl.dias[d.key][i];
            if (!item) return { text: '', fontSize: 9 };
            const text = item.horario ? `${item.horario} - ${item.nome}` : item.nome;
            return { text: text, fontSize: 9, padding: [3, 4, 3, 4] };
        });
        bodyRows.push(row);
    }

    const docDefinition = {
        pageSize: 'A4', pageMargins: [30, 60, 30, 30],
        header: { text: `PLANNER: ${pl.nome.toUpperCase()}`, style: 'header', alignment: 'center', margin: [0, 20, 0, 10] },
        content: [
            { text: `Gerado em: ${new Date().toLocaleDateString('pt-BR')} | ${totalItens} tarefas`, alignment: 'center', fontSize: 9, color: '#888', margin: [0, 0, 0, 15] },
            { table: { widths: colWidths, body: bodyRows }, layout: { hLineWidth: () => 0.5, vLineWidth: () => 0.5, hLineColor: () => '#ddd', vLineColor: () => '#ddd', fillColor: (rowIndex) => rowIndex === 0 ? '#34495e' : null } },
            { text: '\n' },
            { text: 'Notas:', bold: true, fontSize: 11, margin: [0, 15, 0, 5] },
            { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 535, y2: 0, lineWidth: 1, lineColor: '#ccc' }], margin: [0, 0, 0, 12] },
            { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 535, y2: 0, lineWidth: 1, lineColor: '#ccc' }], margin: [0, 0, 0, 12] },
            { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 535, y2: 0, lineWidth: 1, lineColor: '#ccc' }] }
        ],
        styles: { header: { fontSize: 18, bold: true, color: '#2c3e50' }, tableHeader: { color: '#fff', bold: true } },
        defaultStyle: { font: 'Roboto' }
    };

    pdfMake.createPdf(docDefinition).download(`Planner_${pl.nome.replace(/\s+/g, '_')}.pdf`);
    showToast('PDF do planner gerado!', 'success');
}
