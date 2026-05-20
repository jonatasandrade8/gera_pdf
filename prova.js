/* prova.js - Criador de Provas */

const PROVAS_KEY = 'provas_app';
let prova = { cabecalho: {}, secoes: [] };
let draggedQuestao = null;

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('provaData').value = hojeISO();
    renderEditor();
    renderPreview();
    renderProvasSalvas();
    atalhosTeclado({ 's': salvarProva });
});

function execCmd(cmd) { document.execCommand(cmd, false, null); document.getElementById('questaoEnunciado').focus(); }
function fecharModal(id) { document.getElementById(id).classList.remove('active'); }
document.addEventListener('click', (e) => { if (e.target.classList.contains('modal-overlay')) e.target.classList.remove('active'); });

// === SEÇÕES ===

function adicionarSecao() {
    document.getElementById('secaoTitulo').value = '';
    document.getElementById('secaoInstrucoes').value = '';
    document.getElementById('secaoEditId').value = '';
    document.getElementById('modalSecao').classList.add('active');
    setTimeout(() => document.getElementById('secaoTitulo').focus(), 100);
}

function editarSecao(id) {
    const secao = prova.secoes.find(s => s.id === id);
    document.getElementById('secaoTitulo').value = secao.titulo;
    document.getElementById('secaoInstrucoes').value = secao.instrucoes || '';
    document.getElementById('secaoEditId').value = id;
    document.getElementById('modalSecao').classList.add('active');
}

function salvarSecao() {
    const titulo = document.getElementById('secaoTitulo').value.trim();
    if (!titulo) { showToast('Digite o título da seção.', 'warning'); return; }
    const editId = document.getElementById('secaoEditId').value;
    const secao = { id: editId || gerarId(), titulo: titulo, instrucoes: document.getElementById('secaoInstrucoes').value.trim(), questoes: [] };
    if (editId) {
        const idx = prova.secoes.findIndex(s => s.id === editId);
        secao.questoes = prova.secoes[idx].questoes;
        prova.secoes[idx] = secao;
    } else {
        prova.secoes.push(secao);
    }
    fecharModal('modalSecao');
    renderEditor(); renderPreview(); updateStats();
    showToast('Seção salva!', 'success');
}

function deletarSecao(id) {
    if (!confirm('Excluir esta seção e todas as questões?')) return;
    prova.secoes = prova.secoes.filter(s => s.id !== id);
    renderEditor(); renderPreview(); updateStats();
    showToast('Seção excluída.', 'info');
}

// === QUESTÕES ===

function adicionarQuestao(secaoId = null) {
    document.getElementById('questaoTipo').value = 'discursiva';
    document.getElementById('questaoEnunciado').innerHTML = '';
    document.getElementById('questaoValor').value = '1.0';
    document.getElementById('questaoEspaco').value = '4';
    document.getElementById('questaoEditId').value = '';
    document.getElementById('questaoSecaoId').value = secaoId || (prova.secoes.length > 0 ? prova.secoes[prova.secoes.length - 1].id : '');
    document.getElementById('modalQuestaoTitulo').textContent = 'Nova Questão';
    renderQuestaoForm();
    document.getElementById('modalQuestao').classList.add('active');
    setTimeout(() => document.getElementById('questaoEnunciado').focus(), 100);
}

function editarQuestao(secaoId, questaoId) {
    const secao = prova.secoes.find(s => s.id === secaoId);
    const q = secao.questoes.find(q => q.id === questaoId);
    document.getElementById('questaoTipo').value = q.tipo;
    document.getElementById('questaoEnunciado').innerHTML = q.enunciado;
    document.getElementById('questaoValor').value = q.valor;
    document.getElementById('questaoEspaco').value = q.espaco || 4;
    document.getElementById('questaoEditId').value = questaoId;
    document.getElementById('questaoSecaoId').value = secaoId;
    document.getElementById('modalQuestaoTitulo').textContent = 'Editar Questão';
    renderQuestaoForm();
    if (q.tipo === 'multipla_escolha' && q.opcoes) {
        q.opcoes.forEach((op, i) => {
            const input = document.getElementById(`opcao_${i}`);
            if (input) input.value = op.texto;
            const radio = document.getElementById(`correta_${i}`);
            if (radio) radio.checked = op.correta;
        });
    }
    if (q.tipo === 'objetiva_vf' && q.respostaCorreta) {
        const radio = document.querySelector(`input[name="respostaVF"][value="${q.respostaCorreta}"]`);
        if (radio) radio.checked = true;
    }
    document.getElementById('modalQuestao').classList.add('active');
}

function deletarQuestao(secaoId, questaoId) {
    const secao = prova.secoes.find(s => s.id === secaoId);
    secao.questoes = secao.questoes.filter(q => q.id !== questaoId);
    renderEditor(); renderPreview(); updateStats();
    showToast('Questão removida.', 'info');
}

function renderQuestaoForm() {
    const tipo = document.getElementById('questaoTipo').value;
    const container = document.getElementById('questaoOpcoesContainer');
    if (tipo === 'multipla_escolha') {
        const letras = ['A', 'B', 'C', 'D', 'E'];
        let html = '<div class="form-group"><label>Opções (marque a correta)</label>';
        letras.forEach((l, i) => {
            html += `<div class="option-row"><span class="option-letter">${l})</span><input type="text" id="opcao_${i}" placeholder="Texto da opção ${l}"><input type="radio" name="corretaMC" id="correta_${i}" value="${i}" title="Marcar como correta"></div>`;
        });
        html += '</div>';
        container.innerHTML = html;
    } else if (tipo === 'objetiva_vf') {
        container.innerHTML = `<div class="form-group"><label>Resposta Correta</label>
            <div style="display: flex; gap: 15px; margin-top: 5px;">
                <label><input type="radio" name="respostaVF" value="V"> Verdadeiro</label>
                <label><input type="radio" name="respostaVF" value="F"> Falso</label>
            </div></div>`;
    } else if (tipo === 'correspondencia') {
        container.innerHTML = `<div class="form-group"><label>Itens para Correspondência (um por linha)</label>
            <textarea id="correspondenciaItens" rows="4" placeholder="Coluna A:\n1. Item 1\n2. Item 2\n\nColuna B:\na. Opção A\nb. Opção B"></textarea></div>`;
    } else {
        container.innerHTML = '';
    }
}

function salvarQuestao() {
    const enunciado = document.getElementById('questaoEnunciado').innerHTML.trim();
    if (!enunciado || enunciado === '<br>') { showToast('Digite o enunciado da questão.', 'warning'); return; }
    const tipo = document.getElementById('questaoTipo').value;
    const secaoId = document.getElementById('questaoSecaoId').value;
    if (!secaoId) { showToast('Crie ou selecione uma seção primeiro.', 'warning'); return; }
    const secao = prova.secoes.find(s => s.id === secaoId);
    const questao = {
        id: document.getElementById('questaoEditId').value || gerarId(),
        tipo: tipo,
        enunciado: enunciado,
        valor: parseFloat(document.getElementById('questaoValor').value) || 1,
        espaco: parseInt(document.getElementById('questaoEspaco').value) || 4,
        respostaCorreta: null,
        opcoes: []
    };

    if (tipo === 'multipla_escolha') {
        const letras = ['A', 'B', 'C', 'D', 'E'];
        letras.forEach((l, i) => {
            const texto = document.getElementById(`opcao_${i}`)?.value || '';
            const correta = document.getElementById(`correta_${i}`)?.checked || false;
            questao.opcoes.push({ letra: l, texto: texto, correta: correta });
            if (correta) questao.respostaCorreta = l;
        });
    } else if (tipo === 'objetiva_vf') {
        const selected = document.querySelector('input[name="respostaVF"]:checked');
        if (selected) questao.respostaCorreta = selected.value;
    } else if (tipo === 'correspondencia') {
        const itens = document.getElementById('correspondenciaItens')?.value || '';
        questao.respostaCorreta = itens;
    }

    const editId = document.getElementById('questaoEditId').value;
    if (editId) {
        const idx = secao.questoes.findIndex(q => q.id === editId);
        secao.questoes[idx] = questao;
    } else {
        secao.questoes.push(questao);
    }

    fecharModal('modalQuestao');
    renderEditor(); renderPreview(); updateStats();
    showToast(editId ? 'Questão atualizada!' : 'Questão adicionada!', 'success');
}

function duplicarQuestao(secaoId, questaoId) {
    const secao = prova.secoes.find(s => s.id === secaoId);
    const q = secao.questoes.find(q => q.id === questaoId);
    const nova = JSON.parse(JSON.stringify(q));
    nova.id = gerarId();
    secao.questoes.push(nova);
    renderEditor(); renderPreview(); updateStats();
    showToast('Questão duplicada!', 'success');
}

// === DRAG & DROP QUESTÕES ===

function onDragStartQ(e, secaoId, questaoId) {
    draggedQuestao = { secaoId, questaoId };
    e.dataTransfer.effectAllowed = 'move';
}

function onDropQ(e, secaoId, targetId) {
    e.preventDefault();
    if (!draggedQuestao || draggedQuestao.questaoId === targetId) return;
    if (draggedQuestao.secaoId !== secaoId) return;
    const secao = prova.secoes.find(s => s.id === secaoId);
    const fromIdx = secao.questoes.findIndex(q => q.id === draggedQuestao.questaoId);
    const toIdx = secao.questoes.findIndex(q => q.id === targetId);
    const [moved] = secao.questoes.splice(fromIdx, 1);
    secao.questoes.splice(toIdx, 0, moved);
    draggedQuestao = null;
    renderEditor(); renderPreview();
}

// === EDITOR ===

function renderEditor() {
    const container = document.getElementById('provaEditor');
    if (prova.secoes.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: var(--text-muted); padding: 30px;">Nenhuma seção criada. Clique em "Nova Seção" para começar.</p>';
        return;
    }
    let html = '';
    let globalNum = 1;
    prova.secoes.forEach(secao => {
        html += `<div class="section-editor">
            <div class="section-editor-header">
                <div>
                    <strong>${secao.titulo}</strong>
                    ${secao.instrucoes ? `<br><small style="color: var(--text-muted);">${secao.instrucoes}</small>` : ''}
                    <br><small style="color: var(--text-muted);">${secao.questoes.length} questão(ões) | Valor: ${calcValorSecao(secao)}</small>
                </div>
                <div style="display: flex; gap: 4px;">
                    <button class="btn btn-secondary btn-sm" onclick="adicionarQuestao('${secao.id}')" style="width: auto; margin: 0; padding: 4px 10px; font-size: 0.8rem;">+ Questão</button>
                    <button class="btn btn-outline btn-sm" onclick="editarSecao('${secao.id}')" style="width: auto; margin: 0; padding: 4px 10px; font-size: 0.8rem;">✏️</button>
                    <button class="btn btn-danger btn-sm" onclick="deletarSecao('${secao.id}')" style="width: auto; margin: 0; padding: 4px 10px; font-size: 0.8rem;">🗑️</button>
                </div>
            </div>
            <div class="section-editor-body">`;

        if (secao.questoes.length === 0) {
            html += '<p style="text-align: center; color: var(--text-muted); padding: 15px; font-size: 0.9rem;">Nenhuma questão nesta seção.</p>';
        }

        secao.questoes.forEach(q => {
            const tipoLabel = { discursiva: 'Discursiva', objetiva_vf: 'V/F', multipla_escolha: 'Múltipla Escolha', lacuna: 'Lacuna', correspondencia: 'Correspondência' };
            html += `<div class="question-editor draggable" draggable="true" ondragstart="onDragStartQ(event, '${secao.id}', '${q.id}')" ondragover="event.preventDefault()" ondrop="onDropQ(event, '${secao.id}', '${q.id}')">
                <div class="question-header">
                    <div>
                        <span class="question-number">Questão ${globalNum}</span>
                        <span class="question-type-badge">${tipoLabel[q.tipo] || q.tipo}</span>
                        <span style="font-size: 0.8rem; color: var(--text-muted); margin-left: 8px;">Valor: ${q.valor.toFixed(1)}</span>
                    </div>
                    <div style="display: flex; gap: 4px;">
                        <button class="task-action-btn" onclick="editarQuestao('${secao.id}', '${q.id}')" title="Editar">✏️</button>
                        <button class="task-action-btn" onclick="duplicarQuestao('${secao.id}', '${q.id}')" title="Duplicar">📋</button>
                        <button class="task-action-btn" onclick="deletarQuestao('${secao.id}', '${q.id}')" title="Excluir">🗑️</button>
                    </div>
                </div>
                <div class="question-body" style="font-size: 0.9rem;">${q.enunciado}</div>`;

            if (q.tipo === 'multipla_escolha' && q.opcoes) {
                html += '<div class="question-options">';
                q.opcoes.forEach(op => {
                    html += `<div style="font-size: 0.85rem; margin: 2px 0;">${op.letra}) ${op.texto || '(sem texto)'}</div>`;
                });
                html += '</div>';
            }
            if (q.tipo === 'objetiva_vf') {
                html += `<div style="font-size: 0.85rem; margin-top: 5px;">( ) Verdadeiro &nbsp;&nbsp; ( ) Falso</div>`;
            }

            html += '</div>';
            globalNum++;
        });

        html += '</div></div>';
    });
    container.innerHTML = html;
}

function calcValorSecao(secao) { return secao.questoes.reduce((sum, q) => sum + q.valor, 0).toFixed(1); }

function calcValorTotal() { return prova.secoes.reduce((sum, s) => sum + s.questoes.reduce((s2, q) => s2 + q.valor, 0), 0); }

function countQuestoes() { return prova.secoes.reduce((sum, s) => sum + s.questoes.length, 0); }

function updateStats() {
    document.getElementById('statQuestoes').textContent = countQuestoes();
    document.getElementById('statSecoes').textContent = prova.secoes.length;
    document.getElementById('statValor').textContent = calcValorTotal().toFixed(1);
}

// === PRÉVIA ===

function renderPreview() {
    const preview = document.getElementById('provaPreview');
    const instituicao = document.getElementById('provaInstituicao').value;
    const professor = document.getElementById('provaProfessor').value;
    const disciplina = document.getElementById('provaDisciplina').value;
    const data = document.getElementById('provaData').value;
    const valor = document.getElementById('provaValor').value;
    const instrucoes = document.getElementById('provaInstrucoes').value;
    const campoAluno = document.getElementById('provaCampoAluno').checked;

    if (!instituicao && !disciplina && countQuestoes() === 0) {
        preview.innerHTML = '<p style="text-align: center; color: #999; padding-top: 100px;">Preencha o cabeçalho e adicione questões para ver a prévia.</p>';
        return;
    }

    let html = '';

    // Cabeçalho
    html += '<div class="preview-header">';
    if (instituicao) html += `<h2>${instituicao}</h2>`;
    if (professor) html += `<p>Professor(a): ${professor}</p>`;
    if (disciplina) html += `<p><strong>${disciplina}</strong></p>`;
    if (data) html += `<p>Data: ${formatarDataCurta(data)}</p>`;
    if (valor) html += `<p>Valor: ${valor} pontos</p>`;
    html += '</div>';

    // Campo do aluno
    if (campoAluno) {
        html += '<div class="student-info"><p>Nome: <span class="line"></span></p><p>Turma: <span class="line" style="min-width: 100px;"></span></p></div>';
    }

    // Instruções
    if (instrucoes) {
        html += `<div style="margin-bottom: 15px; padding: 8px; background: #f9f9f9; border-radius: 4px; font-size: 0.85rem;"><strong>Instruções:</strong> ${instrucoes}</div>`;
    }

    // Questões
    let globalNum = 1;
    prova.secoes.forEach(secao => {
        if (secao.questoes.length === 0) return;
        html += `<div class="section-title-preview">${secao.titulo}</div>`;
        if (secao.instrucoes) html += `<p style="font-size: 0.85rem; color: #666; margin-bottom: 10px; font-style: italic;">${secao.instrucoes}</p>`;

        secao.questoes.forEach(q => {
            html += `<div class="q-preview">`;
            html += `<p class="q-num">Questão ${globalNum} (${q.valor.toFixed(1)} pts)</p>`;
            html += `<p class="q-text">${q.enunciado}</p>`;

            if (q.tipo === 'multipla_escolha' && q.opcoes) {
                html += '<div class="q-opts">';
                q.opcoes.forEach(op => { html += `<p>${op.letra}) ${op.texto || '...'}</p>`; });
                html += '</div>';
            }
            if (q.tipo === 'objetiva_vf') {
                html += '<div class="q-opts"><p>( ) Verdadeiro &nbsp;&nbsp; ( ) Falso</p></div>';
            }
            if (q.tipo === 'discursiva' || q.tipo === 'lacuna') {
                const altura = (q.espaco || 4) * 25;
                html += `<div class="q-answer-space" style="min-height: ${altura}px;"></div>`;
            }
            if (q.tipo === 'correspondencia') {
                html += '<div style="display: flex; gap: 30px; font-size: 0.9rem; margin: 10px 0;"><div><strong>Coluna A:</strong><br>1. ___<br>2. ___<br>3. ___</div><div><strong>Coluna B:</strong><br>( a ) ___<br>( b ) ___<br>( c ) ___</div></div>';
            }

            html += '</div>';
            globalNum++;
        });
    });

    preview.innerHTML = html;
}

// === TEMPLATES ===

function aplicarTemplate(tipo) {
    if (prova.secoes.length > 0 && !confirm('Isso substituirá o conteúdo atual. Continuar?')) return;

    const templates = {
        matematica: {
            instituicao: 'Colégio Estadual', professor: '', disciplina: 'Matemática',
            secoes: [
                { titulo: 'Parte 1 - Quest Objetivas', instrucoes: 'Marque apenas uma alternativa.', questoes: [
                    { tipo: 'multipla_escolha', enunciado: 'Qual é o resultado de 15 × 8?', valor: 1, espaco: 0, opcoes: [{ letra: 'A', texto: '100', correta: false }, { letra: 'B', texto: '120', correta: true }, { letra: 'C', texto: '130', correta: false }, { letra: 'D', texto: '115', correta: false }, { letra: 'E', texto: '125', correta: false }], respostaCorreta: 'B' },
                    { tipo: 'multipla_escolha', enunciado: 'Qual é a raiz quadrada de 144?', valor: 1, espaco: 0, opcoes: [{ letra: 'A', texto: '10', correta: false }, { letra: 'B', texto: '11', correta: false }, { letra: 'C', texto: '12', correta: true }, { letra: 'D', texto: '13', correta: false }, { letra: 'E', texto: '14', correta: false }], respostaCorreta: 'C' },
                ]},
                { titulo: 'Parte 2 - Questões Discursivas', instrucoes: 'Resolva mostrando os cálculos.', questoes: [
                    { tipo: 'discursiva', enunciado: 'Resolva a equação: 2x + 10 = 30. Mostre todos os cálculos.', valor: 2, espaco: 6, opcoes: [], respostaCorreta: null },
                    { tipo: 'discursiva', enunciado: 'Um terreno retangular tem 25m de comprimento e 18m de largura. Calcule a área e o perímetro.', valor: 2, espaco: 8, opcoes: [], respostaCorreta: null },
                ]}
            ]
        },
        portugues: {
            instituicao: 'Colégio Estadual', professor: '', disciplina: 'Língua Portuguesa',
            secoes: [
                { titulo: 'Interpretação de Texto', instrucoes: 'Leia o texto e responda.', questoes: [
                    { tipo: 'discursiva', enunciado: 'Leia o texto abaixo e responda: Qual é a ideia principal do texto?<br><br><em>"A tecnologia tem transformado a maneira como nos comunicamos, trabalhamos e nos relacionamos. Cada vez mais, dispositivos digitais fazem parte do nosso cotidiano."</em>', valor: 3, espaco: 6, opcoes: [], respostaCorreta: null },
                ]},
                { titulo: 'Gramática', instrucoes: '', questoes: [
                    { tipo: 'multipla_escolha', enunciado: 'Na frase "Os alunos estudaram <b>muito</b> para a prova", a palavra destacada é:', valor: 1, espaco: 0, opcoes: [{ letra: 'A', texto: 'Substantivo', correta: false }, { letra: 'B', texto: 'Adjetivo', correta: false }, { letra: 'C', texto: 'Advérbio', correta: true }, { letra: 'D', texto: 'Verbo', correta: false }, { letra: 'E', texto: 'Pronome', correta: false }], respostaCorreta: 'C' },
                    { tipo: 'objetiva_vf', enunciado: 'Na frase "Ela chegou cedo", a palavra "cedo" é um adjunto adverbial de tempo.', valor: 1, espaco: 0, opcoes: [], respostaCorreta: 'V' },
                ]}
            ]
        },
        ciencias: {
            instituicao: 'Colégio Estadual', professor: '', disciplina: 'Ciências',
            secoes: [
                { titulo: 'Questões Objetivas', instrucoes: 'Marque a alternativa correta.', questoes: [
                    { tipo: 'multipla_escolha', enunciado: 'Qual é o planeta mais próximo do Sol?', valor: 1, espaco: 0, opcoes: [{ letra: 'A', texto: 'Vênus', correta: false }, { letra: 'B', texto: 'Mercúrio', correta: true }, { letra: 'C', texto: 'Terra', correta: false }, { letra: 'D', texto: 'Marte', correta: false }, { letra: 'E', texto: 'Júpiter', correta: false }], respostaCorreta: 'B' },
                ]},
                { titulo: 'Questões Discursivas', instrucoes: 'Responda de forma completa.', questoes: [
                    { tipo: 'discursiva', enunciado: 'Explique o ciclo da água na natureza.', valor: 3, espaco: 8, opcoes: [], respostaCorreta: null },
                ]}
            ]
        },
        historia: {
            instituicao: 'Colégio Estadual', professor: '', disciplina: 'História',
            secoes: [
                { titulo: 'Questões', instrucoes: '', questoes: [
                    { tipo: 'discursiva', enunciado: 'Quais foram as principais causas da Revolução Francesa?', valor: 3, espaco: 8, opcoes: [], respostaCorreta: null },
                    { tipo: 'multipla_escolha', enunciado: 'Em que ano o Brasil foi descoberto por Pedro Álvares Cabral?', valor: 1, espaco: 0, opcoes: [{ letra: 'A', texto: '1492', correta: false }, { letra: 'B', texto: '1500', correta: true }, { letra: 'C', texto: '1510', correta: false }, { letra: 'D', texto: '1498', correta: false }, { letra: 'E', texto: '1502', correta: false }], respostaCorreta: 'B' },
                ]}
            ]
        },
        geografia: {
            instituicao: 'Colégio Estadual', professor: '', disciplina: 'Geografia',
            secoes: [
                { titulo: 'Questões', instrucoes: '', questoes: [
                    { tipo: 'multipla_escolha', enunciado: 'Qual é o maior bioma brasileiro em extensão territorial?', valor: 1, espaco: 0, opcoes: [{ letra: 'A', texto: 'Cerrado', correta: false }, { letra: 'B', texto: 'Amazônia', correta: true }, { letra: 'C', texto: 'Caatinga', correta: false }, { letra: 'D', texto: 'Pantanal', correta: false }, { letra: 'E', texto: 'Mata Atlântica', correta: false }], respostaCorreta: 'B' },
                    { tipo: 'discursiva', enunciado: 'Explique a diferença entre clima e tempo meteorológico.', valor: 2, espaco: 6, opcoes: [], respostaCorreta: null },
                ]}
            ]
        },
        vazio: { instituicao: '', professor: '', disciplina: '', secoes: [] }
    };

    const t = templates[tipo] || templates.vazio;
    document.getElementById('provaInstituicao').value = t.instituicao;
    document.getElementById('provaProfessor').value = t.professor;
    document.getElementById('provaDisciplina').value = t.disciplina;

    prova.secoes = t.secoes.map(s => ({
        id: gerarId(), titulo: s.titulo, instrucoes: s.instrucoes,
        questoes: s.questoes.map(q => ({ ...q, id: gerarId() }))
    }));

    renderEditor(); renderPreview(); updateStats();
    showToast('Template aplicado!', 'success');
}

// === SALVAR / CARREGAR ===

function coletarDadosProva() {
    return {
        cabecalho: {
            instituicao: document.getElementById('provaInstituicao').value,
            professor: document.getElementById('provaProfessor').value,
            disciplina: document.getElementById('provaDisciplina').value,
            data: document.getElementById('provaData').value,
            valor: document.getElementById('provaValor').value,
            instrucoes: document.getElementById('provaInstrucoes').value,
            campoAluno: document.getElementById('provaCampoAluno').checked
        },
        secoes: prova.secoes
    };
}

function salvarProva() {
    const dados = coletarDadosProva();
    if (countQuestoes() === 0) { showToast('Adicione pelo menos uma questão.', 'warning'); return; }
    const nome = dados.cabecalho.disciplina || 'Prova sem nome';
    const provaSalva = { nome: nome, dataCriacao: new Date().toLocaleDateString('pt-BR'), dados: dados };
    const result = storageAdd(PROVAS_KEY, provaSalva);
    if (result) {
        showToast('Prova salva com sucesso!', 'success');
        renderProvasSalvas();
    }
}

function carregarProva(id) {
    const saved = storageFind(PROVAS_KEY, id);
    if (!saved) return;
    const dados = saved.dados;
    document.getElementById('provaInstituicao').value = dados.cabecalho.instituicao || '';
    document.getElementById('provaProfessor').value = dados.cabecalho.professor || '';
    document.getElementById('provaDisciplina').value = dados.cabecalho.disciplina || '';
    document.getElementById('provaData').value = dados.cabecalho.data || hojeISO();
    document.getElementById('provaValor').value = dados.cabecalho.valor || '';
    document.getElementById('provaInstrucoes').value = dados.cabecalho.instrucoes || '';
    document.getElementById('provaCampoAluno').checked = dados.cabecalho.campoAluno !== false;
    prova.secoes = dados.secoes || [];
    renderEditor(); renderPreview(); updateStats();
    showToast('Prova carregada!', 'success');
}

function deletarProvaSalva(id) {
    if (!confirm('Excluir esta prova salva?')) return;
    storageRemove(PROVAS_KEY, id);
    renderProvasSalvas();
    showToast('Prova excluída.', 'info');
}

function renderProvasSalvas() {
    const container = document.getElementById('provasSalvas');
    const provas = storageGet(PROVAS_KEY);
    if (provas.length === 0) {
        container.innerHTML = '<p style="color: var(--text-muted); text-align: center; padding: 10px;">Nenhuma prova salva.</p>';
        return;
    }
    container.innerHTML = provas.map(p => `
        <div class="saved-item animate-fade-in">
            <span>${p.nome} <small style="display: block; color: var(--text-muted); font-weight: normal;">${p.dataCriacao}</small></span>
            <div class="saved-item-actions">
                <button class="btn-load" onclick="carregarProva(${p.id})">Carregar</button>
                <button class="btn-delete" onclick="deletarProvaSalva(${p.id})">Excluir</button>
            </div>
        </div>
    `).join('');
}

function limparProva() {
    if (!confirm('Limpar toda a prova?')) return;
    prova.secoes = [];
    document.getElementById('provaInstituicao').value = '';
    document.getElementById('provaProfessor').value = '';
    document.getElementById('provaDisciplina').value = '';
    document.getElementById('provaValor').value = '';
    document.getElementById('provaInstrucoes').value = '';
    document.getElementById('provaData').value = hojeISO();
    renderEditor(); renderPreview(); updateStats();
    showToast('Prova limpa.', 'info');
}

// === PDF DA PROVA ===

function gerarPDFProva() {
    if (countQuestoes() === 0) { showToast('Adicione pelo menos uma questão.', 'warning'); return; }

    const instituicao = document.getElementById('provaInstituicao').value;
    const professor = document.getElementById('provaProfessor').value;
    const disciplina = document.getElementById('provaDisciplina').value;
    const data = document.getElementById('provaData').value;
    const valor = document.getElementById('provaValor').value;
    const instrucoes = document.getElementById('provaInstrucoes').value;
    const campoAluno = document.getElementById('provaCampoAluno').checked;

    let content = [];

    // Header
    let headerTexts = [];
    if (instituicao) headerTexts.push({ text: instituicao, bold: true, fontSize: 14, alignment: 'center' });
    if (professor) headerTexts.push({ text: `Professor(a): ${professor}`, fontSize: 10, alignment: 'center' });
    if (disciplina) headerTexts.push({ text: disciplina, bold: true, fontSize: 12, alignment: 'center', margin: [0, 5, 0, 0] });
    let metaLine = [];
    if (data) metaLine.push(`Data: ${formatarDataCurta(data)}`);
    if (valor) metaLine.push(`Valor: ${valor} pontos`);
    if (metaLine.length > 0) headerTexts.push({ text: metaLine.join(' | '), fontSize: 10, alignment: 'center' });
    content.push({ stack: headerTexts, margin: [0, 0, 0, 10] });

    // Student info
    if (campoAluno) {
        content.push({
            table: { widths: ['*', 100], body: [
                [{ text: 'Nome: _____________________________________________', fontSize: 10 }, { text: 'Turma: _______', fontSize: 10 }]
            ] }, layout: 'noBorders', margin: [0, 0, 0, 10]
        });
    }

    // Instructions
    if (instrucoes) {
        content.push({ text: `Instruções: ${instrucoes}`, fontSize: 9, italics: true, margin: [0, 0, 0, 10] });
    }

    // Questions
    let globalNum = 1;
    prova.secoes.forEach(secao => {
        if (secao.questoes.length === 0) return;
        content.push({ text: secao.titulo, bold: true, fontSize: 11, margin: [0, 10, 0, 3], fillColor: '#f0f0f0', padding: [5, 3] });
        if (secao.instrucoes) content.push({ text: secao.instrucoes, fontSize: 9, italics: true, color: '#666', margin: [0, 0, 0, 5] });

        secao.questoes.forEach(q => {
            let qContent = [];
            qContent.push({ text: [{ text: `Questão ${globalNum} `, bold: true, fontSize: 10 }, { text: `(${q.valor.toFixed(1)} pts)`, fontSize: 9, color: '#666' }], margin: [0, 5, 0, 3] });

            // Parse HTML enunciado to plain text for PDF
            const plainText = q.enunciado.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&');
            qContent.push({ text: plainText, fontSize: 10, margin: [10, 0, 0, 5] });

            if (q.tipo === 'multipla_escolha' && q.opcoes) {
                const opts = q.opcoes.map(op => `${op.letra}) ${op.texto || '...'}`).join('\n');
                qContent.push({ text: opts, fontSize: 10, margin: [20, 0, 0, 5] });
            }
            if (q.tipo === 'objetiva_vf') {
                qContent.push({ text: '(   ) Verdadeiro          (   ) Falso', fontSize: 10, margin: [20, 0, 0, 5] });
            }
            if (q.tipo === 'discursiva' || q.tipo === 'lacuna' || q.tipo === 'correspondencia') {
                const linhas = q.espaco || 4;
                const lines = [];
                for (let i = 0; i < linhas; i++) {
                    lines.push({ text: '________________________________________________________________________', fontSize: 8, color: '#ccc', margin: [0, 8, 0, 0] });
                }
                qContent.push({ stack: lines, margin: [10, 5, 0, 0] });
            }

            content.push({ stack: qContent, margin: [0, 0, 0, 5] });
            globalNum++;
        });
    });

    const docDefinition = {
        pageSize: 'A4', pageMargins: [40, 40, 40, 40],
        content: content,
        defaultStyle: { font: 'Roboto' }
    };

    const fileName = `Prova_${(disciplina || 'sem_nome').replace(/\s+/g, '_')}_${data || hojeISO()}.pdf`;
    pdfMake.createPdf(docDefinition).download(fileName);
    showToast('PDF da prova gerado!', 'success');
}

// === PDF DO GABARITO ===

function gerarPDFGabarito() {
    if (countQuestoes() === 0) { showToast('Adicione pelo menos uma questão.', 'warning'); return; }

    const disciplina = document.getElementById('provaDisciplina').value;
    const data = document.getElementById('provaData').value;

    let tableBody = [
        [{ text: 'Questão', style: 'tableHeader' }, { text: 'Tipo', style: 'tableHeader' }, { text: 'Resposta Correta', style: 'tableHeader' }, { text: 'Valor', style: 'tableHeader' }]
    ];

    let globalNum = 1;
    prova.secoes.forEach(secao => {
        secao.questoes.forEach(q => {
            let resposta = '-';
            if (q.tipo === 'multipla_escolha') {
                const correta = q.opcoes?.find(o => o.correta);
                resposta = correta ? `${correta.letra}) ${correta.texto}` : 'Não definida';
            } else if (q.tipo === 'objetiva_vf') {
                resposta = q.respostaCorreta || 'Não definida';
            } else if (q.tipo === 'correspondencia') {
                resposta = 'Ver modelo';
            } else {
                resposta = 'Discursiva';
            }

            tableBody.push([
                { text: globalNum.toString(), alignment: 'center', fontSize: 10 },
                { text: q.tipo === 'multipla_escolha' ? 'Múltipla' : q.tipo === 'objetiva_vf' ? 'V/F' : q.tipo === 'discursiva' ? 'Discursiva' : q.tipo, fontSize: 9 },
                { text: resposta, fontSize: 9 },
                { text: q.valor.toFixed(1), alignment: 'center', fontSize: 10 }
            ]);
            globalNum++;
        });
    });

    const docDefinition = {
        pageSize: 'A4', pageMargins: [40, 40, 40, 40],
        header: { text: `GABARITO - ${disciplina || 'Prova'}`, style: 'header', alignment: 'center', margin: [0, 20, 0, 10] },
        content: [
            { text: `Data: ${formatarDataCurta(data)} | Total de Questões: ${countQuestoes()} | Valor Total: ${calcValorTotal().toFixed(1)}`, alignment: 'center', fontSize: 10, color: '#666', margin: [0, 0, 0, 15] },
            { table: { headerRows: 1, widths: [60, 80, '*', 60], body: tableBody }, layout: 'lightHorizontalLines' }
        ],
        styles: {
            header: { fontSize: 18, bold: true, color: '#c0392b' },
            tableHeader: { bold: true, fontSize: 10, color: '#FFFFFF', fillColor: '#c0392b', alignment: 'center' }
        },
        defaultStyle: { font: 'Roboto' }
    };

    const fileName = `Gabarito_${(disciplina || 'sem_nome').replace(/\s+/g, '_')}_${data || hojeISO()}.pdf`;
    pdfMake.createPdf(docDefinition).download(fileName);
    showToast('PDF do gabarito gerado!', 'success');
}
