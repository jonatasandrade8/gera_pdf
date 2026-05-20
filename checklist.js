/* checklist.js - Checklists & Organização de Tarefas */

const CHECKLISTS_KEY = 'checklists_app';
let checklists = [];
let activeChecklistId = null;
let currentView = 'list';
let calendarDate = new Date();
let weekStart = getWeekStart(new Date());
let draggedTask = null;

document.addEventListener('DOMContentLoaded', () => {
    checklists = storageGet(CHECKLISTS_KEY);
    renderChecklistList();
    if (checklists.length > 0) {
        selecionarChecklist(checklists[0].id);
    }
});

// === CHECKLISTS ===

function salvarChecklists() { storageSet(CHECKLISTS_KEY, checklists); }

function getActiveChecklist() { return checklists.find(c => c.id === activeChecklistId); }

function abrirModalNovoChecklist() {
    document.getElementById('novoChecklistNome').value = '';
    document.getElementById('modalNovoChecklist').classList.add('active');
    setTimeout(() => document.getElementById('novoChecklistNome').focus(), 100);
}

function criarChecklist() {
    const nome = document.getElementById('novoChecklistNome').value.trim();
    if (!nome) { showToast('Digite um nome para o checklist.', 'warning'); return; }
    const novo = { id: gerarId(), nome: nome, tarefas: [], criadoEm: hojeISO() };
    checklists.push(novo);
    salvarChecklists();
    renderChecklistList();
    selecionarChecklist(novo.id);
    fecharModal('modalNovoChecklist');
    showToast(`Checklist "${nome}" criado!`, 'success');
}

function deletarChecklist(id, e) {
    e.stopPropagation();
    const cl = checklists.find(c => c.id === id);
    if (!confirm(`Excluir checklist "${cl.nome}" e todas as tarefas?`)) return;
    checklists = checklists.filter(c => c.id !== id);
    salvarChecklists();
    if (activeChecklistId === id) {
        activeChecklistId = null;
        document.getElementById('checklistContent').innerHTML = '<div style="text-align: center; padding: 60px 20px; color: var(--text-muted);"><p style="font-size: 3rem; margin-bottom: 15px;">📋</p><p>Selecione ou crie um checklist para começar</p></div>';
    }
    renderChecklistList();
    showToast('Checklist excluído.', 'info');
}

function renderChecklistList() {
    const lista = document.getElementById('checklistList');
    lista.innerHTML = '';
    checklists.forEach(cl => {
        const total = cl.tarefas.length;
        const concluidas = cl.tarefas.filter(t => t.concluida).length;
        const pct = total > 0 ? Math.round((concluidas / total) * 100) : 0;
        const li = document.createElement('li');
        li.className = `checklist-list-item ${cl.id === activeChecklistId ? 'active' : ''}`;
        li.onclick = () => selecionarChecklist(cl.id);
        li.innerHTML = `
            <div style="flex: 1;">
                <div style="font-weight: 600;">${cl.nome}</div>
                <div style="font-size: 0.75rem; color: var(--text-muted);">${concluidas}/${total} concluídas (${pct}%)</div>
                <div class="progress-bar" style="margin-top: 4px;"><div class="progress-bar-fill" style="width: ${pct}%;"></div></div>
            </div>
            <button class="delete-checklist" onclick="deletarChecklist('${cl.id}', event)" title="Excluir">🗑️</button>
        `;
        lista.appendChild(li);
    });
}

function selecionarChecklist(id) {
    activeChecklistId = id;
    renderChecklistList();
    currentView = 'list';
    renderChecklistContent();
}

// === TAREFAS ===

function abrirModalTarefa(editId = null) {
    document.getElementById('tarefaEditId').value = editId || '';
    document.getElementById('modalTarefaTitulo').textContent = editId ? 'Editar Tarefa' : 'Nova Tarefa';
    if (editId) {
        const cl = getActiveChecklist();
        const task = cl.tarefas.find(t => t.id === editId);
        document.getElementById('tarefaTitulo').value = task.titulo;
        document.getElementById('tarefaPrioridade').value = task.prioridade;
        document.getElementById('tarefaData').value = task.data || '';
        document.getElementById('tarefaNotas').value = task.notas || '';
    } else {
        document.getElementById('tarefaTitulo').value = '';
        document.getElementById('tarefaPrioridade').value = 'medium';
        document.getElementById('tarefaData').value = '';
        document.getElementById('tarefaNotas').value = '';
    }
    document.getElementById('modalNovaTarefa').classList.add('active');
    setTimeout(() => document.getElementById('tarefaTitulo').focus(), 100);
}

function salvarTarefa() {
    const titulo = document.getElementById('tarefaTitulo').value.trim();
    if (!titulo) { showToast('Digite o título da tarefa.', 'warning'); return; }
    const cl = getActiveChecklist();
    if (!cl) return;
    const editId = document.getElementById('tarefaEditId').value;
    const tarefa = {
        id: editId || gerarId(),
        titulo: titulo,
        prioridade: document.getElementById('tarefaPrioridade').value,
        data: document.getElementById('tarefaData').value,
        notas: document.getElementById('tarefaNotas').value.trim(),
        concluida: false,
        criadaEm: hojeISO()
    };
    if (editId) {
        const idx = cl.tarefas.findIndex(t => t.id === editId);
        tarefa.concluida = cl.tarefas[idx].concluida;
        tarefa.criadaEm = cl.tarefas[idx].criadaEm;
        cl.tarefas[idx] = tarefa;
        showToast('Tarefa atualizada!', 'success');
    } else {
        cl.tarefas.push(tarefa);
        showToast('Tarefa adicionada!', 'success');
    }
    salvarChecklists();
    fecharModal('modalNovaTarefa');
    renderChecklistContent();
    renderChecklistList();
}

function toggleTarefa(taskId) {
    const cl = getActiveChecklist();
    const task = cl.tarefas.find(t => t.id === taskId);
    task.concluida = !task.concluida;
    salvarChecklists();
    renderChecklistContent();
    renderChecklistList();
}

function deletarTarefa(taskId) {
    const cl = getActiveChecklist();
    cl.tarefas = cl.tarefas.filter(t => t.id !== taskId);
    salvarChecklists();
    renderChecklistContent();
    renderChecklistList();
    showToast('Tarefa removida.', 'info');
}

function isOverdue(dateStr) {
    if (!dateStr) return false;
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const due = new Date(dateStr + 'T00:00:00');
    return due < today;
}

// === DRAG & DROP ===

function onDragStart(e, taskId) {
    draggedTask = taskId;
    e.target.closest('.task-card').classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
}

function onDragEnd(e) {
    e.target.closest('.task-card')?.classList.remove('dragging');
    document.querySelectorAll('.task-card').forEach(c => c.classList.remove('drag-over'));
    draggedTask = null;
}

function onDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    const card = e.target.closest('.task-card');
    if (card) card.classList.add('drag-over');
}

function onDragLeave(e) {
    const card = e.target.closest('.task-card');
    if (card) card.classList.remove('drag-over');
}

function onDrop(e, targetTaskId) {
    e.preventDefault();
    const card = e.target.closest('.task-card');
    if (card) card.classList.remove('drag-over');
    if (!draggedTask || draggedTask === targetTaskId) return;
    const cl = getActiveChecklist();
    const fromIdx = cl.tarefas.findIndex(t => t.id === draggedTask);
    const toIdx = cl.tarefas.findIndex(t => t.id === targetTaskId);
    const [moved] = cl.tarefas.splice(fromIdx, 1);
    cl.tarefas.splice(toIdx, 0, moved);
    salvarChecklists();
    renderChecklistContent();
}

// === FILTROS ===

function filtrarTarefas(filtro) {
    const cl = getActiveChecklist();
    if (!cl) return [];
    let tarefas = [...cl.tarefas];
    if (filtro === 'pendentes') tarefas = tarefas.filter(t => !t.concluida);
    else if (filtro === 'concluidas') tarefas = tarefas.filter(t => t.concluida);
    else if (filtro === 'high' || filtro === 'medium' || filtro === 'low') tarefas = tarefas.filter(t => t.prioridade === filtro);
    return tarefas;
}

function buscarTarefas(query) {
    const cl = getActiveChecklist();
    if (!cl) return [];
    const q = query.toLowerCase();
    return cl.tarefas.filter(t => t.titulo.toLowerCase().includes(q) || (t.notas && t.notas.toLowerCase().includes(q)));
}

// === RENDERIZAÇÃO ===

function renderChecklistContent() {
    const cl = getActiveChecklist();
    if (!cl) return;
    const content = document.getElementById('checklistContent');
    if (currentView === 'list') {
        renderListView(content, cl);
    } else if (currentView === 'calendar') {
        renderCalendarView(content, cl);
    } else if (currentView === 'weekly') {
        renderWeeklyView(content, cl);
    }
}

function renderListView(container, cl) {
    const total = cl.tarefas.length;
    const concluidas = cl.tarefas.filter(t => t.concluida).length;
    const pct = total > 0 ? Math.round((concluidas / total) * 100) : 0;

    container.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; flex-wrap: wrap; gap: 10px;">
            <h2 style="margin: 0;">${cl.nome}</h2>
            <div class="view-toggle">
                <button class="${currentView === 'list' ? 'active' : ''}" onclick="mudarView('list')">📋 Lista</button>
                <button class="${currentView === 'calendar' ? 'active' : ''}" onclick="mudarView('calendar')">📅 Calendário</button>
                <button class="${currentView === 'weekly' ? 'active' : ''}" onclick="mudarView('weekly')">📆 Semanal</button>
            </div>
        </div>
        <div style="display: flex; gap: 15px; align-items: center; margin-bottom: 15px; flex-wrap: wrap;">
            <div style="flex: 1; min-width: 200px;">
                <div class="progress-bar"><div class="progress-bar-fill" style="width: ${pct}%;"></div></div>
                <span style="font-size: 0.8rem; color: var(--text-muted);">${concluidas}/${total} concluídas (${pct}%)</span>
            </div>
            <button class="btn btn-primary btn-sm" onclick="abrirModalTarefa()" style="width: auto; margin: 0;">+ Nova Tarefa</button>
            <button class="btn btn-secondary btn-sm" onclick="gerarPDFChecklist()" style="width: auto; margin: 0;">📥 PDF</button>
        </div>
        <div class="filter-bar">
            <input type="text" placeholder="🔍 Buscar tarefas..." oninput="renderFilteredTasks(this.value, document.getElementById('filterSelect').value)">
            <select id="filterSelect" onchange="renderFilteredTasks(document.querySelector('.filter-bar input').value, this.value)">
                <option value="todas">Todas</option>
                <option value="pendentes">Pendentes</option>
                <option value="concluidas">Concluídas</option>
                <option value="high">🔴 Alta</option>
                <option value="medium">🟡 Média</option>
                <option value="low">🟢 Baixa</option>
            </select>
        </div>
        <div id="taskList"></div>
    `;
    renderTaskList(cl.tarefas);
}

function renderFilteredTasks(query, filtro) {
    let tarefas = getActiveChecklist()?.tarefas || [];
    if (query) tarefas = tarefas.filter(t => t.titulo.toLowerCase().includes(query.toLowerCase()) || (t.notas && t.notas.toLowerCase().includes(query.toLowerCase())));
    if (filtro === 'pendentes') tarefas = tarefas.filter(t => !t.concluida);
    else if (filtro === 'concluidas') tarefas = tarefas.filter(t => t.concluida);
    else if (['high', 'medium', 'low'].includes(filtro)) tarefas = tarefas.filter(t => t.prioridade === filtro);
    renderTaskList(tarefas);
}

function renderTaskList(tarefas) {
    const container = document.getElementById('taskList');
    if (!container) return;
    if (tarefas.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: var(--text-muted); padding: 30px;">Nenhuma tarefa encontrada.</p>';
        return;
    }
    container.innerHTML = '';
    tarefas.forEach(task => {
        const overdue = !task.concluida && isOverdue(task.data);
        const card = document.createElement('div');
        card.className = `task-card draggable ${task.concluida ? 'completed' : ''}`;
        card.draggable = true;
        card.ondragstart = (e) => onDragStart(e, task.id);
        card.ondragend = onDragEnd;
        card.ondragover = onDragOver;
        card.ondragleave = onDragLeave;
        card.ondrop = (e) => onDrop(e, task.id);
        card.innerHTML = `
            <span class="task-drag-handle" title="Arrastar para reordenar">⠿</span>
            <input type="checkbox" class="task-checkbox" ${task.concluida ? 'checked' : ''} onchange="toggleTarefa('${task.id}')">
            <div class="task-content">
                <div class="task-title">${task.titulo}</div>
                <div class="task-meta">
                    <span class="badge badge-priority-${task.prioridade}">${task.prioridade === 'high' ? 'Alta' : task.prioridade === 'medium' ? 'Média' : 'Baixa'}</span>
                    ${task.data ? `<span class="task-date ${overdue ? 'overdue' : ''}">📅 ${formatarDataCurta(task.data)}${overdue ? ' (Vencida!)' : ''}</span>` : ''}
                </div>
                ${task.notas ? `<div class="task-notes">${task.notas}</div>` : ''}
            </div>
            <div class="task-actions">
                <button class="task-action-btn" onclick="abrirModalTarefa('${task.id}')" title="Editar">✏️</button>
                <button class="task-action-btn" onclick="deletarTarefa('${task.id}')" title="Excluir">🗑️</button>
            </div>
        `;
        container.appendChild(card);
    });
}

// === CALENDÁRIO ===

function renderCalendarView(container, cl) {
    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();
    const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    const tasksByDate = {};
    cl.tarefas.forEach(t => { if (t.data) { if (!tasksByDate[t.data]) tasksByDate[t.data] = []; tasksByDate[t.data].push(t); } });

    let cells = '';
    dayNames.forEach(d => { cells += `<div class="calendar-header-cell">${d}</div>`; });

    const prevMonthDays = new Date(year, month, 0).getDate();
    for (let i = firstDay - 1; i >= 0; i--) {
        const day = prevMonthDays - i;
        cells += `<div class="calendar-day other-month"><div class="calendar-day-number">${day}</div></div>`;
    }

    for (let d = 1; d <= daysInMonth; d++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        const isToday = dateStr === todayStr;
        const dayTasks = tasksByDate[dateStr] || [];
        const hasTasks = dayTasks.length > 0;
        let taskDots = '';
        dayTasks.slice(0, 3).forEach(t => {
            const cor = t.prioridade === 'high' ? 'var(--accent-red)' : t.prioridade === 'medium' ? 'var(--accent-orange)' : 'var(--accent-green)';
            taskDots += `<span class="calendar-task-dot" style="background-color: ${cor};" title="${t.titulo}"></span>`;
        });
        let taskItems = '';
        dayTasks.slice(0, 2).forEach(t => {
            taskItems += `<div class="calendar-task-item priority-${t.prioridade} ${t.concluida ? 'completed' : ''}" onclick="event.stopPropagation(); abrirModalTarefa('${t.id}')">${t.titulo}</div>`;
        });

        cells += `<div class="calendar-day ${isToday ? 'today' : ''} ${hasTasks ? 'has-tasks' : ''}" onclick="abrirDiaCalendario('${dateStr}')">
            <div class="calendar-day-number">${d}</div>
            <div>${taskDots}</div>
            <div>${taskItems}</div>
        </div>`;
    }

    const totalCells = firstDay + daysInMonth;
    const remaining = (7 - (totalCells % 7)) % 7;
    for (let i = 1; i <= remaining; i++) {
        cells += `<div class="calendar-day other-month"><div class="calendar-day-number">${i}</div></div>`;
    }

    container.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; flex-wrap: wrap; gap: 10px;">
            <h2 style="margin: 0;">${cl.nome} - Calendário</h2>
            <div class="view-toggle">
                <button onclick="mudarView('list')">📋 Lista</button>
                <button class="active" onclick="mudarView('calendar')">📅 Calendário</button>
                <button onclick="mudarView('weekly')">📆 Semanal</button>
            </div>
        </div>
        <div class="calendar-nav">
            <button onclick="calendarNav(-1)">◀ Anterior</button>
            <span class="calendar-month-title">${monthNames[month]} ${year}</span>
            <button onclick="calendarNav(1)">Próximo ▶</button>
        </div>
        <div class="calendar-grid">${cells}</div>
    `;
}

function calendarNav(dir) {
    calendarDate.setMonth(calendarDate.getMonth() + dir);
    renderChecklistContent();
}

function abrirDiaCalendario(dateStr) {
    const cl = getActiveChecklist();
    const dayTasks = cl.tarefas.filter(t => t.data === dateStr);
    const [ano, mes, dia] = dateStr.split('-');
    document.getElementById('modalDiaTitulo').textContent = `Tarefas - ${dia}/${mes}/${ano}`;
    const content = document.getElementById('modalDiaContent');
    if (dayTasks.length === 0) {
        content.innerHTML = '<p style="text-align: center; color: var(--text-muted); padding: 20px;">Nenhuma tarefa neste dia.</p>';
    } else {
        content.innerHTML = dayTasks.map(t => `
            <div class="task-card ${t.concluida ? 'completed' : ''}" style="margin-bottom: 8px;">
                <input type="checkbox" class="task-checkbox" ${t.concluida ? 'checked' : ''} onchange="toggleTarefa('${t.id}'); abrirDiaCalendario('${dateStr}');">
                <div class="task-content">
                    <div class="task-title">${t.titulo}</div>
                    <div class="task-meta"><span class="badge badge-priority-${t.prioridade}">${t.prioridade === 'high' ? 'Alta' : t.prioridade === 'medium' ? 'Média' : 'Baixa'}</span></div>
                    ${t.notas ? `<div class="task-notes">${t.notas}</div>` : ''}
                </div>
                <div class="task-actions">
                    <button class="task-action-btn" onclick="abrirModalTarefa('${t.id}'); fecharModal('modalDiaCalendario');">✏️</button>
                    <button class="task-action-btn" onclick="deletarTarefa('${t.id}'); abrirDiaCalendario('${dateStr}');">🗑️</button>
                </div>
            </div>
        `).join('');
    }
    document.getElementById('modalDiaCalendario').dataset.date = dateStr;
    document.getElementById('modalDiaCalendario').classList.add('active');
}

function adicionarTarefaNoDia() {
    const dateStr = document.getElementById('modalDiaCalendario').dataset.date;
    fecharModal('modalDiaCalendario');
    abrirModalTarefa();
    setTimeout(() => { document.getElementById('tarefaData').value = dateStr; }, 100);
}

// === VISÃO SEMANAL ===

function getWeekStart(date) {
    const d = new Date(date);
    const day = d.getDay();
    d.setDate(d.getDate() - day);
    d.setHours(0, 0, 0, 0);
    return d;
}

function renderWeeklyView(container, cl) {
    const dayNames = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    const ws = getWeekStart(weekStart);
    const we = new Date(ws); we.setDate(we.getDate() + 6);
    const todayStr = hojeISO();

    const tasksByDate = {};
    cl.tarefas.forEach(t => { if (t.data) { if (!tasksByDate[t.data]) tasksByDate[t.data] = []; tasksByDate[t.data].push(t); } });

    let columns = '';
    for (let i = 0; i < 7; i++) {
        const d = new Date(ws); d.setDate(d.getDate() + i);
        const dateStr = d.toISOString().split('T')[0];
        const isToday = dateStr === todayStr;
        const dayTasks = tasksByDate[dateStr] || [];
        const tasksHTML = dayTasks.map(t => `
            <div class="weekly-task priority-${t.prioridade} ${t.concluida ? 'completed' : ''}" onclick="abrirModalTarefa('${t.id}')">
                ${t.titulo}
            </div>
        `).join('');

        columns += `<div class="weekly-day" style="${isToday ? 'border-color: var(--accent-blue); background-color: rgba(52,152,219,0.05);' : ''}">
            <div class="weekly-day-header">${dayNames[i]}<br><span style="font-size: 0.75rem; color: var(--text-muted);">${d.getDate()}/${d.getMonth() + 1}</span></div>
            ${tasksHTML}
        </div>`;
    }

    container.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; flex-wrap: wrap; gap: 10px;">
            <h2 style="margin: 0;">${cl.nome} - Visão Semanal</h2>
            <div class="view-toggle">
                <button onclick="mudarView('list')">📋 Lista</button>
                <button onclick="mudarView('calendar')">📅 Calendário</button>
                <button class="active" onclick="mudarView('weekly')">📆 Semanal</button>
            </div>
        </div>
        <div class="calendar-nav">
            <button onclick="weekNav(-1)">◀ Semana Anterior</button>
            <span class="calendar-month-title">${ws.getDate()}/${ws.getMonth() + 1} - ${we.getDate()}/${we.getMonth() + 1}/${we.getFullYear()}</span>
            <button onclick="weekNav(1)">Próxima Semana ▶</button>
        </div>
        <div class="weekly-grid">${columns}</div>
    `;
}

function weekNav(dir) {
    weekStart.setDate(weekStart.getDate() + (dir * 7));
    renderChecklistContent();
}

function mudarView(view) {
    currentView = view;
    renderChecklistContent();
}

// === MODAL ===

function fecharModal(id) { document.getElementById(id).classList.remove('active'); }

document.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal-overlay')) e.target.classList.remove('active');
});

// === PDF ===

function gerarPDFChecklist() {
    const cl = getActiveChecklist();
    if (!cl) { showToast('Selecione um checklist.', 'warning'); return; }
    const total = cl.tarefas.length;
    const concluidas = cl.tarefas.filter(t => t.concluida).length;

    const tableBody = [
        [{ text: '#', style: 'tableHeader' }, { text: 'TAREFA', style: 'tableHeader' }, { text: 'PRIORIDADE', style: 'tableHeader' }, { text: 'VENCIMENTO', style: 'tableHeader' }, { text: 'STATUS', style: 'tableHeader' }]
    ];

    cl.tarefas.forEach((t, i) => {
        tableBody.push([
            (i + 1).toString(),
            { text: t.titulo, fontSize: 10 },
            { text: t.prioridade === 'high' ? 'Alta' : t.prioridade === 'medium' ? 'Média' : 'Baixa', fontSize: 9, alignment: 'center' },
            { text: t.data ? formatarDataCurta(t.data) : '-', fontSize: 9, alignment: 'center' },
            { text: t.concluida ? '✅ Concluída' : '⬜ Pendente', fontSize: 9, alignment: 'center' }
        ]);
    });

    const docDefinition = {
        pageSize: 'A4', pageMargins: [40, 60, 40, 40],
        header: { text: `CHECKLIST: ${cl.nome.toUpperCase()}`, style: 'header', alignment: 'center', margin: [0, 20, 0, 10] },
        content: [
            { text: `Gerado em: ${new Date().toLocaleDateString('pt-BR')} | ${concluidas}/${total} concluídas`, alignment: 'center', fontSize: 10, color: '#666', margin: [0, 0, 0, 20] },
            { table: { headerRows: 1, widths: [30, '*', 80, 80, 80], body: tableBody }, layout: 'lightHorizontalLines' },
            { text: '\n' },
            { text: `Progresso: ${total > 0 ? Math.round((concluidas / total) * 100) : 0}% concluído`, alignment: 'center', fontSize: 11, bold: true }
        ],
        styles: {
            header: { fontSize: 18, bold: true, color: '#2c3e50' },
            tableHeader: { bold: true, fontSize: 10, color: '#FFFFFF', fillColor: '#34495e', alignment: 'center' }
        },
        defaultStyle: { font: 'Roboto' }
    };

    pdfMake.createPdf(docDefinition).download(`Checklist_${cl.nome.replace(/\s+/g, '_')}.pdf`);
    showToast('PDF do checklist gerado!', 'success');
}
