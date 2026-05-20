/* utils.js - Funções compartilhadas para todas as ferramentas */

// --- SISTEMA DE TOAST / NOTIFICAÇÕES ---

function showToast(message, type = 'info', duration = 3000) {
    const container = getToastContainer();
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
    toast.innerHTML = `<span class="toast-icon">${icons[type] || icons.info}</span><span class="toast-message">${message}</span><button class="toast-close" onclick="this.parentElement.remove()">&times;</button>`;
    container.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('toast-show'));
    if (duration > 0) setTimeout(() => { toast.classList.remove('toast-show'); setTimeout(() => toast.remove(), 300); }, duration);
}

function getToastContainer() {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        document.body.appendChild(container);
    }
    return container;
}

// --- LOADING SPINNER ---

function showLoading(targetId, text = 'Buscando...') {
    const target = document.getElementById(targetId);
    if (!target) return;
    target.dataset.originalValue = target.value || '';
    target.value = text;
    target.classList.add('loading');
}

function hideLoading(targetId) {
    const target = document.getElementById(targetId);
    if (!target) return;
    target.classList.remove('loading');
    if (target.dataset.originalValue !== undefined) {
        target.value = target.dataset.originalValue;
        delete target.dataset.originalValue;
    }
}

// --- MÁSCARAS DE INPUT ---

function formatarTelefone(input) {
    let v = input.value.replace(/\D/g, '');
    v = v.replace(/^(\d{2})(\d)/g, '($1) $2');
    v = v.replace(/(\d{5})(\d)/, '$1-$2');
    input.value = v.slice(0, 15);
}

function formatarCEP(input) {
    let v = input.value.replace(/\D/g, '');
    v = v.replace(/^(\d{5})(\d)/, '$1-$2');
    input.value = v.slice(0, 9);
}

function formatarCPF(input) {
    let v = input.value.replace(/\D/g, '');
    v = v.replace(/(\d{3})(\d)/, '$1.$2');
    v = v.replace(/(\d{3})(\d)/, '$1.$2');
    v = v.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    input.value = v.slice(0, 14);
}

function formatarCNPJ(input) {
    let v = input.value.replace(/\D/g, '');
    v = v.replace(/^(\d{2})(\d)/, '$1.$2');
    v = v.replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3');
    v = v.replace(/\.(\d{3})(\d)/, '.$1/$2');
    v = v.replace(/(\d{4})(\d)/, '$1-$2');
    input.value = v.slice(0, 18);
}

function formatarDocumento(input, type) {
    if (type === 'pf') return formatarCPF(input);
    return formatarCNPJ(input);
}

function formatarMoedaInput(input) {
    let v = input.value.replace(/\D/g, '');
    if (v.length === 0) { input.value = ''; return; }
    v = (v / 100).toFixed(2);
    v = v.replace('.', ',').replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.');
    input.value = 'R$ ' + v;
}

function parseMoeda(valorString) {
    if (!valorString) return 0;
    let v = valorString.replace('R$', '').replace(/\s/g, '').replace(/\./g, '').replace(',', '.');
    return parseFloat(v) || 0;
}

function formatarParaMoeda(valor) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 }).format(valor);
}

// --- BUSCA DE APIs EXTERNAS ---

async function buscarCEP(cep, campos) {
    const cepLimpo = cep.replace(/\D/g, '');
    if (cepLimpo.length !== 8) return null;
    try {
        const response = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
        if (!response.ok) throw new Error('CEP não encontrado');
        const data = await response.json();
        if (data.erro) { showToast('CEP não encontrado.', 'error'); return null; }
        if (campos.rua) campos.rua.value = data.logradouro || '';
        if (campos.cidade) campos.cidade.value = data.localidade || '';
        if (campos.uf) campos.uf.value = data.uf || '';
        if (campos.bairro) campos.bairro.value = data.bairro || '';
        if (campos.num) campos.num.focus();
        showToast('Endereço encontrado!', 'success');
        return data;
    } catch (error) {
        showToast('Não foi possível buscar o CEP.', 'error');
        return null;
    }
}

async function buscarCNPJ(cnpj, campos) {
    const cnpjLimpo = cnpj.replace(/\D/g, '');
    if (cnpjLimpo.length !== 14) return null;
    try {
        if (campos.nome) campos.nome.value = 'Buscando...';
        const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpjLimpo}`);
        if (!response.ok) throw new Error('CNPJ não encontrado');
        const data = await response.json();
        if (campos.nome) campos.nome.value = data.razao_social || '';
        if (campos.cep) campos.cep.value = data.cep ? data.cep.replace(/^(\d{5})(\d)/, '$1-$2') : '';
        if (campos.rua) campos.rua.value = data.logradouro || '';
        if (campos.num) campos.num.value = data.numero || '';
        if (campos.cidade) campos.cidade.value = data.municipio || '';
        if (campos.uf) campos.uf.value = data.uf || '';
        if (campos.tel) campos.tel.value = data.ddd_telefone_1 || '';
        if (campos.bairro) campos.bairro.value = data.bairro || '';
        showToast('Dados da empresa encontrados!', 'success');
        return data;
    } catch (error) {
        showToast('Não foi possível buscar o CNPJ.', 'error');
        if (campos.nome) campos.nome.value = '';
        return null;
    }
}

// --- LOCALSTORAGE HELPERS ---

function storageGet(key) {
    try { return JSON.parse(localStorage.getItem(key)) || []; } catch { return []; }
}

function storageSet(key, data) {
    try { localStorage.setItem(key, JSON.stringify(data)); return true; } catch (e) { showToast('Erro ao salvar: armazenamento cheio.', 'error'); return false; }
}

function storageAdd(key, item) {
    const items = storageGet(key);
    items.push({ id: Date.now(), ...item });
    return storageSet(key, items) ? items : null;
}

function storageRemove(key, id) {
    const items = storageGet(key).filter(i => i.id !== id);
    storageSet(key, items);
}

function storageFind(key, id) {
    return storageGet(key).find(i => i.id === id);
}

// --- VALIDAÇÃO VISUAL ---

function validarCampo(input) {
    const value = input.value.trim();
    if (!value) {
        input.classList.add('input-error');
        input.classList.remove('input-success');
        return false;
    }
    input.classList.remove('input-error');
    input.classList.add('input-success');
    return true;
}

function validarCampos(ids) {
    let validos = true;
    ids.forEach(id => {
        const input = document.getElementById(id);
        if (input && !validarCampo(input)) validos = false;
    });
    return validos;
}

function limparValidacao(ids) {
    ids.forEach(id => {
        const input = document.getElementById(id);
        if (input) { input.classList.remove('input-error'); input.classList.remove('input-success'); }
    });
}

// --- UTILITÁRIOS GERAIS ---

function formatarDataExtenso(dataStr) {
    if (!dataStr) return 'Data não informada';
    const [ano, mes, dia] = dataStr.split('-');
    const data = new Date(ano, mes - 1, dia);
    return data.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
}

function formatarDataCurta(dataStr) {
    if (!dataStr) return '';
    const [ano, mes, dia] = dataStr.split('-');
    return `${dia}/${mes}/${ano}`;
}

function gerarId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function hojeISO() {
    return new Date().toISOString().split('T')[0];
}

function atalhosTeclado(map) {
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && map[e.key]) {
            e.preventDefault();
            map[e.key]();
        }
    });
}
