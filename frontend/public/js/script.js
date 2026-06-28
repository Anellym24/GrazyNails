// ===== PROCEDIMENTOS =====
const PROCEDIMENTOS_DEFAULT = [
  {id:'pe-mao-simples',    nome:'Pé e Mão Simples',             preco:45,  cat:'tradicional'},
  {id:'francesinha',       nome:'Francesinha',                   preco:48,  cat:'tradicional'},
  {id:'decoradas-mao',     nome:'Decoradas à Mão',              preco:56,  cat:'tradicional'},
  {id:'decoradas-adesivo', nome:'Decoradas com Adesivos',       preco:52,  cat:'tradicional'},
  {id:'cutilegam-base',    nome:'Cutílegam + Base Comum',       preco:36,  cat:'tradicional'},
  {id:'cutilegam-top',     nome:'Cutílegam + Top Coat',         preco:38,  cat:'tradicional'},
  {id:'fibra-vidro',       nome:'Fibra de Vidro',               preco:140, cat:'alongamento'},
  {id:'acrygel',           nome:'Acrygel',                      preco:130, cat:'alongamento'},
  {id:'banho-gel',         nome:'Banho de Gel',                 preco:100, cat:'alongamento'},
  {id:'postica-simples',   nome:'Postiça Simples',              preco:40,  cat:'postica'},
  {id:'postica-dec',       nome:'Postiça Realista Decorada',    preco:60,  cat:'postica'},
  {id:'postica-enc',       nome:'Postiça Realista Encapsulada', preco:70,  cat:'postica'},
  {id:'gel-simples',       nome:'Esmaltação em Gel – Simples',  preco:30,  cat:'gel'},
  {id:'gel-decorada',      nome:'Esmaltação em Gel – Decorada', preco:38,  cat:'gel'},
  {id:'pe-esfo-motor',     nome:'Pé + Esfoliação + Motor',      preco:40,  cat:'pes'},
  {id:'pe-mao-esfo',       nome:'Pé e Mão + Esfoliação',        preco:60,  cat:'pes'},
  {id:'pe-motor',          nome:'Pé + Motor',                   preco:28,  cat:'pes'},
  {id:'plastica-pes',      nome:'Plástica dos Pés + Esm.',      preco:70,  cat:'pes'},
  {id:'manut-fibra',       nome:'Manutenção Fibra/Acrylgel',    preco:95,  cat:'manutencao'},
  {id:'reposicao',         nome:'Reposição de Unhas',           preco:5,   cat:'manutencao'},
];

// Tenta carregar lista atualizada do backend; fallback para a lista padrão
let PROCEDIMENTOS = [...PROCEDIMENTOS_DEFAULT];

async function carregarProcedimentos() {
  try {
    const lista = await Servicos.listar();
    if (Array.isArray(lista) && lista.length > 0) {
      PROCEDIMENTOS = lista;
    }
  } catch (_) {
    // mantém PROCEDIMENTOS_DEFAULT em caso de erro
  }
  renderCheckboxes();
}

// ===== RENDER CHECKBOXES =====
function renderCheckboxes() {
  const grid = document.getElementById('procGrid');
  if (!grid) return;
  grid.innerHTML = PROCEDIMENTOS.map(p => `
    <label class="proc-item" id="pi-${p.id}" onclick="toggleProc(event,'${p.id}')">
      <input type="checkbox" id="cb-${p.id}" value="${p.id}" onchange="atualizarResumo()">
      <div class="proc-label">
        <div class="proc-name">${p.nome}</div>
        <div class="proc-price">R$ ${Number(p.preco).toFixed(2).replace('.',',')}</div>
      </div>
    </label>
  `).join('');
}

function toggleProc(e, id) {
  const cb   = document.getElementById('cb-' + id);
  const item = document.getElementById('pi-' + id);
  if (e.target !== cb) { cb.checked = !cb.checked; }
  item.classList.toggle('selected', cb.checked);
  atualizarResumo();
}

function getSelecionados() {
  return PROCEDIMENTOS.filter(p => {
    const cb = document.getElementById('cb-' + p.id);
    return cb && cb.checked;
  });
}

function atualizarResumo() {
  const sels  = getSelecionados();
  const total = sels.reduce((s, p) => s + Number(p.preco), 0);
  const empty = document.getElementById('resumoEmpty');
  const list  = document.getElementById('resumoList');
  const tot   = document.getElementById('resumoTotal');
  const info  = document.getElementById('resumoInfo');

  if (sels.length === 0) {
    empty.style.display = 'block';
    list.style.display  = 'none';
    tot.style.display   = 'none';
  } else {
    empty.style.display = 'none';
    list.style.display  = 'block';
    tot.style.display   = 'flex';
    list.innerHTML = sels.map(p => `
      <li>
        <span class="resumo-proc-name">${p.nome}</span>
        <span class="resumo-proc-price">R$ ${Number(p.preco).toFixed(2).replace('.',',')}</span>
      </li>
    `).join('');
    document.getElementById('resumoTotalVal').textContent = 'R$ ' + total.toFixed(2).replace('.', ',');
  }

  const dataVal = document.getElementById('f-data').value;
  const horaVal = document.getElementById('f-hora').value;
  if (dataVal || horaVal) info.style.display = 'block'; else info.style.display = 'none';
  if (dataVal) document.getElementById('ri-data').textContent =
    new Date(dataVal + 'T12:00').toLocaleDateString('pt-BR', {day:'2-digit', month:'long', year:'numeric'});
  if (horaVal) document.getElementById('ri-hora').textContent = horaVal;
}

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
  carregarProcedimentos(); // carrega do backend (ou usa default imediatamente)
  configurarDataPermitida();
  document.getElementById('f-data').addEventListener('change', validarData);
  document.getElementById('f-data').addEventListener('change', atualizarResumo);
  document.getElementById('f-hora').addEventListener('change', atualizarResumo);
});

// ===== DATA =====
function configurarDataPermitida() {
  const hoje = new Date();
  const dia  = hoje.getDate();
  const mes  = hoje.getMonth();
  const ano  = hoje.getFullYear();

  const mesMax     = (dia >= 30) ? mes + 1 : mes;
  const anoMax     = (mesMax > 11) ? ano + 1 : ano;
  const mesMaxReal = mesMax % 12;
  const ultimoDia  = new Date(anoMax, mesMaxReal + 1, 0);

  const input = document.getElementById('f-data');
  input.min = hoje.toISOString().split('T')[0];
  input.max = ultimoDia.toISOString().split('T')[0];
}

function validarData() {
  const input    = document.getElementById('f-data');
  const val      = input.value;
  if (!val) return;
  const escolhida = new Date(val + 'T12:00');
  const min       = new Date(input.min + 'T12:00');
  const max       = new Date(input.max + 'T12:00');
  if (escolhida < min || escolhida > max) {
    showToast('⚠️', 'Selecione uma data dentro do período permitido.');
    input.value = '';
    atualizarResumo();
  }
}

// ===== FILTRO DE SERVIÇOS (seção vitrine) =====
function filtrarServicos(cat, btn) {
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  document.querySelectorAll('.servico-card').forEach(c => {
    c.classList.toggle('visible', cat === 'todos' || c.dataset.cat === cat);
  });
}

function selecionarServico(nome) {
  const proc = PROCEDIMENTOS.find(p => p.nome.toLowerCase().includes(nome.toLowerCase()));
  if (proc) {
    const cb   = document.getElementById('cb-' + proc.id);
    const item = document.getElementById('pi-' + proc.id);
    if (cb) { cb.checked = true; item.classList.add('selected'); atualizarResumo(); }
  }
  document.getElementById('agendar').scrollIntoView({ behavior: 'smooth' });
}

// ===== ENVIAR AGENDAMENTO =====
async function enviarAgendamento() {
  const nome  = document.getElementById('f-nome').value.trim();
  const whats = document.getElementById('f-whats').value.trim();
  const data  = document.getElementById('f-data').value;
  const hora  = document.getElementById('f-hora').value;
  const sels  = getSelecionados();

  const partesNome = nome.split(' ').filter(p => p.length > 0);
  if (partesNome.length < 2)  { showToast('⚠️', 'Por favor, informe seu nome e sobrenome.'); return; }
  if (!whats)                  { showToast('⚠️', 'Por favor, informe seu WhatsApp.'); return; }
  if (sels.length === 0)       { showToast('⚠️', 'Selecione pelo menos um procedimento.'); return; }
  if (!data)                   { showToast('⚠️', 'Selecione a data desejada.'); return; }
  if (!hora)                   { showToast('⚠️', 'Selecione o horário desejado.'); return; }

  const total = sels.reduce((s, p) => s + Number(p.preco), 0);
  const ag = {
    nome,
    whatsapp:      whats,
    procedimentos: sels.map(p => p.id),
    total,
    data,
    hora,
    status: 'pendente'
  };

  try {
    await Agendamentos.criar(ag);
  } catch (err) {
    console.error(err);
    showToast('❌', err.message || 'Erro ao salvar agendamento.');
    return;
  }

  const dataFmt = new Date(data + 'T12:00').toLocaleDateString('pt-BR', {day:'2-digit', month:'long', year:'numeric'});
  document.getElementById('confirmResumo').innerHTML = `
    <div class="confirm-resumo-row"><span>Cliente</span><strong>${nome}</strong></div>
    <div class="confirm-resumo-row"><span>WhatsApp</span><strong>${whats}</strong></div>
    ${sels.map(p => `<div class="confirm-resumo-row"><span>${p.nome}</span><strong>R$ ${Number(p.preco).toFixed(2).replace('.',',')}</strong></div>`).join('')}
    <div class="confirm-resumo-row"><span>Data</span><strong>${dataFmt}</strong></div>
    <div class="confirm-resumo-row"><span>Horário</span><strong>${hora}</strong></div>
    <div class="confirm-resumo-row"><span>💰 Total</span><strong>R$ ${total.toFixed(2).replace('.', ',')}</strong></div>
  `;
  document.getElementById('confirmOverlay').classList.add('active');

  // Limpa o formulário
  document.getElementById('f-nome').value  = '';
  document.getElementById('f-whats').value = '';
  document.getElementById('f-data').value  = '';
  document.getElementById('f-hora').value  = '';
  document.querySelectorAll('.proc-item').forEach(el => el.classList.remove('selected'));
  document.querySelectorAll('.proc-item input').forEach(cb => cb.checked = false);
  atualizarResumo();
}

function fecharConfirm() {
  document.getElementById('confirmOverlay').classList.remove('active');
}
document.getElementById('confirmOverlay').addEventListener('click', e => {
  if (e.target === document.getElementById('confirmOverlay')) fecharConfirm();
});

// ===== TOAST =====
function showToast(icon, msg) {
  const t = document.getElementById('toast');
  document.querySelector('.t-icon').textContent   = icon;
  document.getElementById('toastMsg').textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3500);
}

// ===== ANIMAÇÕES =====
const obs = new IntersectionObserver(entries => {
  entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
}, { threshold: 0.12 });
document.querySelectorAll('.fade-in').forEach(el => obs.observe(el));

window.addEventListener('scroll', () => {
  document.getElementById('navbar').style.boxShadow =
    window.scrollY > 50 ? '0 2px 32px rgba(44,26,18,0.08)' : 'none';
});