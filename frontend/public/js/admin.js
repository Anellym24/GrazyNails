// admin.js — depende de frontend_api.js carregado antes no admin.html

// ===== AUTH GUARD =====
if (!sessionStorage.getItem('grazy_admin_token')) {
  window.location.replace('login.html');
}

// ===== PROCEDIMENTOS (lista local para montar UI) =====
let PROCEDIMENTOS = [
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
  {id:'pe-esfo-motor',     nome:'Pé + Esfoliação + Motor',     preco:40,  cat:'pes'},
  {id:'pe-mao-esfo',       nome:'Pé e Mão + Esfoliação',       preco:60,  cat:'pes'},
  {id:'pe-motor',          nome:'Pé + Motor',                   preco:28,  cat:'pes'},
  {id:'plastica-pes',      nome:'Plástica dos Pés + Esm.',     preco:70,  cat:'pes'},
  {id:'manut-fibra',       nome:'Manutenção Fibra/Acrylgel',   preco:95,  cat:'manutencao'},
  {id:'reposicao',         nome:'Reposição de Unhas',           preco:5,   cat:'manutencao'},
];

// ===== INIT =====
document.addEventListener('DOMContentLoaded', async () => {
  // Tenta carregar serviços do backend
  try {
    const servicos = await Servicos.listar();
    if (Array.isArray(servicos) && servicos.length > 0) PROCEDIMENTOS = servicos;
  } catch (_) {}

  // Pré-preenche mês/ano do relatório com o mês atual
  const agora = new Date();
  const relMes = document.getElementById('relMes');
  const relAno = document.getElementById('relAno');
  if (relMes) relMes.value = agora.getMonth() + 1;
  if (relAno) relAno.value = agora.getFullYear();

  await atualizarStats();
  await renderTabela();
});

// ===== NAVEGAÇÃO LATERAL =====
function mostrarPagina(pagina) {
  // Esconde todas as páginas
  document.querySelectorAll('.ap-page').forEach(p => p.classList.add('hidden'));
  // Mostra a selecionada
  document.getElementById('page-' + pagina).classList.remove('hidden');

  // Atualiza link ativo na sidebar
  document.querySelectorAll('.sidebar-link').forEach(l => l.classList.remove('active'));
  event.currentTarget.classList.add('active');

  // Ações específicas por página
  if (pagina === 'servicos') renderListaServicos();
  if (pagina === 'agenda') {
    const campoData = document.getElementById('agendaData');
    if (!campoData.value) {
      campoData.value = new Date().toISOString().split('T')[0];
    }
    carregarAgendaVirtual();
  }
  if (pagina === 'relatorios') {
    document.getElementById('relVazio').style.display = 'block';
    document.getElementById('relCards').style.display = 'none';
    document.getElementById('relRankingWrap').style.display = 'none';
  }

  // Fecha sidebar em mobile
  if (window.innerWidth < 900) {
    document.getElementById('apSidebar').classList.remove('open');
  }
}

function toggleSidebar() {
  document.getElementById('apSidebar').classList.toggle('open');
}

// ===== STATS =====
async function atualizarStats() {
  try {
    const stats = await Agendamentos.stats();
    document.getElementById('sTotal').textContent      = stats.total;
    document.getElementById('sHoje').textContent       = stats.hoje;
    document.getElementById('sPendente').textContent   = stats.pendente;
    document.getElementById('sConfirmado').textContent = stats.confirmado;
    const sFeito = document.getElementById('sFeito');
    if (sFeito) sFeito.textContent = stats.feito || 0;
  } catch (e) {
    console.error('Erro ao buscar stats:', e);
  }
}

// ===== TABELA AGENDAMENTOS =====
async function renderTabela() {
  const fNome   = document.getElementById('fNome').value.trim();
  const fData   = document.getElementById('fData').value;
  const fStatus = document.getElementById('fStatus').value;

  const wrap = document.getElementById('tabelaContent');
  wrap.innerHTML = '<p style="text-align:center;padding:20px;color:var(--gold)">Carregando…</p>';

  let lista;
  try {
    lista = await Agendamentos.listar({ nome: fNome, data: fData, status: fStatus });
  } catch (e) {
    wrap.innerHTML = `<p style="text-align:center;color:#e74c3c;padding:20px">Erro ao carregar: ${e.message}</p>`;
    return;
  }

  document.getElementById('apCount').textContent = lista.length + ' agendamento' + (lista.length !== 1 ? 's' : '');

  if (lista.length === 0) {
    wrap.innerHTML = `<div class="ap-empty">
      <div class="e-icon"><i class="fa-solid fa-floppy-disk iconsFundo"></i></div>
      <p>Nenhum agendamento encontrado</p>
      <small>Tente ajustar os filtros de busca</small>
    </div>`;
    await atualizarStats();
    return;
  }

  // Verifica quais agendamentos confirmados já passaram do horário e podem ser marcados como "feito"
  const agora = new Date();

  wrap.innerHTML = `<div style="overflow-x:auto"><table class="ag-table">
    <thead><tr>
      <th>Cliente</th><th>WhatsApp</th><th>Procedimentos</th>
      <th>Valor</th><th>Data</th><th>Hora</th><th>Status</th><th>Ações</th>
    </tr></thead>
    <tbody>
    ${lista.map(a => {
      const procs = (a.procedimentos || []).map(id => {
        const p = PROCEDIMENTOS.find(x => x.id === id);
        return `<span class="proc-tag">${p ? p.nome : id}</span>`;
      }).join('');
      const dataFmt   = new Date(a.data + 'T12:00').toLocaleDateString('pt-BR');
      const criadoFmt = a.criado_em ? new Date(a.criado_em).toLocaleDateString('pt-BR') : '—';

      // Verifica se o atendimento já passou do horário agendado
      const [horaH, horaM] = (a.hora || '00:00').split(':').map(Number);
      const dataHoraAg = new Date(a.data + 'T' + a.hora);
      const jaPassou = agora > dataHoraAg;

      // Botão "Marcar como Feito" aparece apenas para confirmados cujo horário já passou
      const btnFeito = (a.status === 'confirmado' && jaPassou)
        ? `<button class="ac-btn feito" onclick="marcarFeito('${a.id}','${(a.nome||'').replace(/'/g,"\\'")}')">⭐ Feito</button>`
        : '';

      const statusIcon = a.status === 'confirmado' ? '✅'
        : a.status === 'cancelado' ? '❌'
        : a.status === 'feito' ? '⭐'
        : '⏳';

      const nomeEsc = (a.nome || '').replace(/'/g, "\\'");
      const waEsc   = (a.whatsapp || '').replace(/'/g, "\\'");

      return `<tr>
        <td class="td-nome"><strong>${a.nome}</strong><span>Desde ${criadoFmt}</span></td>
        <td><a href="https://wa.me/55${a.whatsapp.replace(/\D/g,'')}" target="_blank"
               style="color:var(--gold);text-decoration:none;font-weight:500">📱 ${a.whatsapp}</a></td>
        <td class="td-procs">${procs || '—'}</td>
        <td class="td-valor">R$ ${(a.total || 0).toFixed(2).replace('.', ',')}</td>
        <td>${dataFmt}</td>
        <td>${a.hora}</td>
        <td><span class="status-badge ${a.status}">${statusIcon} ${a.status}</span></td>
        <td class="td-acoes">
          ${a.status !== 'confirmado' && a.status !== 'feito' ? `<button class="ac-btn aprovar"
              onclick="aprovarAg('${a.id}','${nomeEsc}','${waEsc}','${a.data}','${a.hora}')">✔ Aprovar</button>` : ''}
          ${btnFeito}
          <button class="ac-btn editar" onclick="abrirEdicao('${a.id}')">✏️ Editar</button>
          ${a.status !== 'cancelado' && a.status !== 'feito' ? `<button class="ac-btn cancelar"
              onclick="cancelarAg('${a.id}','${nomeEsc}','${waEsc}','${a.data}','${a.hora}')">✕ Cancelar</button>` : ''}
          <button class="ac-btn excluir" onclick="excluirAg('${a.id}')">🗑</button>
        </td>
      </tr>`;
    }).join('')}
    </tbody></table></div>`;

  await atualizarStats();
}

function limparFiltros() {
  document.getElementById('fNome').value   = '';
  document.getElementById('fData').value   = '';
  document.getElementById('fStatus').value = '';
  renderTabela();
}

// ===== AGENDA VIRTUAL =====
function mudarDiaAgenda(delta) {
  const campo = document.getElementById('agendaData');
  const atual = new Date(campo.value + 'T12:00');
  atual.setDate(atual.getDate() + delta);
  campo.value = atual.toISOString().split('T')[0];
  carregarAgendaVirtual();
}

function irParaHojeAgenda() {
  document.getElementById('agendaData').value = new Date().toISOString().split('T')[0];
  carregarAgendaVirtual();
}

async function carregarAgendaVirtual() {
  const dataEscolhida = document.getElementById('agendaData').value;
  const wrap = document.getElementById('agendaLista');

  // Label amigável (Hoje / Amanhã / dia da semana + data)
  const label = document.getElementById('agendaDataLabel');
  const hojeStr = new Date().toISOString().split('T')[0];
  const amanha = new Date(); amanha.setDate(amanha.getDate() + 1);
  const amanhaStr = amanha.toISOString().split('T')[0];
  const dataObj = new Date(dataEscolhida + 'T12:00');
  const diaSemana = dataObj.toLocaleDateString('pt-BR', { weekday: 'long' });
  const dataFmt = dataObj.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });

  if (dataEscolhida === hojeStr) label.textContent = `Hoje · ${dataFmt}`;
  else if (dataEscolhida === amanhaStr) label.textContent = `Amanhã · ${dataFmt}`;
  else label.textContent = `${diaSemana.charAt(0).toUpperCase() + diaSemana.slice(1)} · ${dataFmt}`;

  wrap.innerHTML = '<p style="text-align:center;padding:30px;color:var(--gold)">Carregando…</p>';

  let lista;
  try {
    lista = await Agendamentos.listar({ data: dataEscolhida, status: 'confirmado' });
  } catch (e) {
    wrap.innerHTML = `<p style="text-align:center;color:#e74c3c;padding:20px">Erro ao carregar: ${e.message}</p>`;
    return;
  }

  // Ordena por horário
  lista.sort((a, b) => (a.hora || '').localeCompare(b.hora || ''));

  if (lista.length === 0) {
    wrap.innerHTML = `<div class="ap-empty">
      <div class="e-icon"><i class="fa-regular fa-calendar iconsFundo"></i></div>
      <p>Nenhum agendamento confirmado para este dia</p>
      <small>Agendamentos pendentes ou já concluídos não aparecem aqui</small>
    </div>`;
    return;
  }

  const agora = new Date();

  wrap.innerHTML = `<div class="ag-timeline">
    ${lista.map(a => {
      const procs = (a.procedimentos || []).map(id => {
        const p = PROCEDIMENTOS.find(x => x.id === id);
        return `<span class="proc-tag">${p ? p.nome : id}</span>`;
      }).join('');

      const dataHoraAg = new Date(a.data + 'T' + a.hora);
      const jaPassou = agora > dataHoraAg;
      const nomeEsc = (a.nome || '').replace(/'/g, "\\'");

      return `<div class="ag-slot ${jaPassou ? 'passou' : ''}">
        <div class="ag-slot-hora">${a.hora}</div>
        <div class="ag-slot-linha"></div>
        <div class="ag-slot-card">
          <div class="ag-slot-topo">
            <div>
              <strong>${a.nome}</strong>
              <a href="https://wa.me/55${(a.whatsapp||'').replace(/\D/g,'')}" target="_blank">📱 ${a.whatsapp}</a>
            </div>
            <span class="td-valor">R$ ${(a.total || 0).toFixed(2).replace('.', ',')}</span>
          </div>
          <div class="ag-slot-procs">${procs || '—'}</div>
          <div class="ag-slot-acoes">
            <button class="ac-btn feito" onclick="marcarFeito('${a.id}','${nomeEsc}')">⭐ Marcar como Feito</button>
            <button class="ac-btn editar" onclick="abrirEdicao('${a.id}')">✏️ Editar</button>
          </div>
        </div>
      </div>`;
    }).join('')}
  </div>`;
}

// ===== AÇÕES =====
async function aprovarAg(id, nome, whatsapp, data, hora) {
  // Abre a aba do WhatsApp já no clique (antes de qualquer await),
  // pois navegadores mobile bloqueiam popups abertos depois de uma espera assíncrona.
  const novaAba = window.open('about:blank', '_blank');
  try {
    await Agendamentos.atualizarStatus(id, 'confirmado');
    const dataFmt = new Date(data + 'T12:00').toLocaleDateString('pt-BR', {day:'2-digit', month:'2-digit'});
    const msg = encodeURIComponent(`Olá, ${nome}! Seu agendamento foi confirmado para o dia ${dataFmt} às ${hora}. Aguardamos você com muito carinho!`);
    const urlWpp = `https://wa.me/55${whatsapp.replace(/\D/g,'')}?text=${msg}`;
    if (novaAba) novaAba.location.href = urlWpp;
    else window.open(urlWpp, '_blank'); // fallback caso o navegador ainda assim tenha bloqueado
    await renderTabela();
    showToast('✅', 'Agendamento aprovado! Mensagem enviada via WhatsApp.');
  } catch (e) {
    if (novaAba) novaAba.close();
    showToast('❌', `Erro ao aprovar: ${e.message}`);
  }
}

async function marcarFeito(id, nome) {
  if (!confirm(`Confirma que o atendimento de ${nome} foi realizado?`)) return;
  try {
    await Agendamentos.atualizarStatus(id, 'feito');
    // Atualiza a view que estiver visível (tabela normal ou agenda virtual)
    const paginaAgenda = document.getElementById('page-agenda');
    if (paginaAgenda && !paginaAgenda.classList.contains('hidden')) {
      await carregarAgendaVirtual();
      await atualizarStats();
    } else {
      await renderTabela();
    }
    showToast('⭐', `Atendimento de ${nome} marcado como feito!`);
  } catch (e) {
    showToast('❌', `Erro: ${e.message}`);
  }
}

async function cancelarAg(id, nome, whatsapp, data, hora) {
  if (!confirm('Confirma o cancelamento deste agendamento?')) return;
  const novaAba = window.open('about:blank', '_blank');
  try {
    await Agendamentos.atualizarStatus(id, 'cancelado');
    const dataFmt = new Date(data + 'T12:00').toLocaleDateString('pt-BR', {day:'2-digit', month:'2-digit'});
    const msg = encodeURIComponent(`Olá, ${nome}! Seu agendamento do dia ${dataFmt} às ${hora} foi cancelado. Nos desculpamos pelo transtorno!`);
    const urlWpp = `https://wa.me/55${whatsapp.replace(/\D/g,'')}?text=${msg}`;
    if (novaAba) novaAba.location.href = urlWpp;
    else window.open(urlWpp, '_blank');
    await renderTabela();
    showToast('❌', 'Agendamento cancelado.');
  } catch (e) {
    if (novaAba) novaAba.close();
    showToast('❌', `Erro ao cancelar: ${e.message}`);
  }
}

async function excluirAg(id) {
  if (!confirm('Deseja excluir permanentemente este agendamento?')) return;
  try {
    await Agendamentos.excluir(id);
    await renderTabela();
    showToast('🗑', 'Agendamento excluído com sucesso.');
  } catch (e) {
    showToast('❌', `Erro ao excluir: ${e.message}`);
  }
}

// ===== EDITAR AGENDAMENTO =====
let _agEditando = null;

async function abrirEdicao(id) {
  try {
    const todos = await Agendamentos.listar({});
    const ag = todos.find(a => String(a.id) === String(id));
    if (!ag) return;
    _agEditando = ag;

    document.getElementById('edit-id').value   = ag.id;
    document.getElementById('edit-data').value = ag.data;
    document.getElementById('edit-hora').value = ag.hora;

    const grid = document.getElementById('editProcGrid');
    grid.innerHTML = PROCEDIMENTOS.map(p => {
      const sel = (ag.procedimentos || []).includes(p.id);
      return `<label class="edit-proc-item ${sel ? 'selected' : ''}" onclick="toggleEditProc(event,'edit-${p.id}')">
        <input type="checkbox" id="edit-${p.id}" value="${p.id}" ${sel ? 'checked' : ''} onchange="calcEditTotal()">
        <div>
          <div class="ep-name">${p.nome}</div>
          <div class="ep-price">R$ ${p.preco}</div>
        </div>
      </label>`;
    }).join('');

    calcEditTotal();
    document.getElementById('editOverlay').classList.add('active');
  } catch (e) {
    showToast('❌', `Erro ao abrir edição: ${e.message}`);
  }
}

function toggleEditProc(e, id) {
  const cb   = document.getElementById(id);
  const item = cb.closest('.edit-proc-item');
  if (e.target !== cb) cb.checked = !cb.checked;
  item.classList.toggle('selected', cb.checked);
  calcEditTotal();
}

function calcEditTotal() {
  const total = PROCEDIMENTOS.filter(p => {
    const cb = document.getElementById('edit-' + p.id);
    return cb && cb.checked;
  }).reduce((s, p) => s + p.preco, 0);
  document.getElementById('editTotalPreview').textContent = 'R$ ' + total.toFixed(2).replace('.', ',');
}

async function salvarEdicao() {
  const id            = document.getElementById('edit-id').value;
  const novaData      = document.getElementById('edit-data').value;
  const novaHora      = document.getElementById('edit-hora').value;
  const procedimentos = PROCEDIMENTOS.filter(p => {
    const cb = document.getElementById('edit-' + p.id);
    return cb && cb.checked;
  }).map(p => p.id);
  const total = PROCEDIMENTOS.filter(p => procedimentos.includes(p.id)).reduce((s, p) => s + p.preco, 0);

  if (!novaData || !novaHora || !procedimentos.length) {
    showToast('⚠️', 'Preencha todos os campos.');
    return;
  }

  // Abre a aba já no clique do botão "Salvar", antes do await (evita bloqueio de popup no mobile)
  const novaAba = (_agEditando) ? window.open('about:blank', '_blank') : null;

  try {
    const dataAntiga = _agEditando ? new Date(_agEditando.data + 'T12:00').toLocaleDateString('pt-BR', {day:'2-digit',month:'2-digit'}) : '';
    const horaAntiga = _agEditando ? _agEditando.hora : '';

    await Agendamentos.editar(id, { data: novaData, hora: novaHora, procedimentos, total });

    if (_agEditando) {
      const dataFmt = new Date(novaData + 'T12:00').toLocaleDateString('pt-BR', {day:'2-digit',month:'2-digit'});
      const msg = encodeURIComponent(`Olá, ${_agEditando.nome}! Seu agendamento foi alterado de ${dataAntiga} às ${horaAntiga} para ${dataFmt} às ${novaHora}. Qualquer dúvida, estamos à disposição!`);
      const urlWpp = `https://wa.me/55${_agEditando.whatsapp.replace(/\D/g,'')}?text=${msg}`;
      if (novaAba) novaAba.location.href = urlWpp;
      else window.open(urlWpp, '_blank');
    }

    fecharEdicao();
    const paginaAgenda = document.getElementById('page-agenda');
    if (paginaAgenda && !paginaAgenda.classList.contains('hidden')) {
      await carregarAgendaVirtual();
    } else {
      await renderTabela();
    }
    showToast('💾', 'Agendamento atualizado com sucesso!');
  } catch (e) {
    if (novaAba) novaAba.close();
    showToast('❌', `Erro ao salvar: ${e.message}`);
  }
}

function fecharEdicao() {
  document.getElementById('editOverlay').classList.remove('active');
  _agEditando = null;
}

document.getElementById('editOverlay').addEventListener('click', e => {
  if (e.target === document.getElementById('editOverlay')) fecharEdicao();
});

// ===== RELATÓRIOS =====
async function carregarRelatorios() {
  const mes = document.getElementById('relMes').value;
  const ano = document.getElementById('relAno').value;

  if (!mes || !ano) { showToast('⚠️', 'Selecione mês e ano.'); return; }

  document.getElementById('relVazio').style.display = 'none';
  document.getElementById('relCards').style.display = 'none';
  document.getElementById('relRankingWrap').style.display = 'none';

  try {
    const token = sessionStorage.getItem('grazy_admin_token');
    const resp  = await fetch(`${API_URL}/api/agendamentos/relatorios?mes=${mes}&ano=${ano}`, {
      headers: { Authorization: 'Bearer ' + token }
    });
    if (!resp.ok) throw new Error('Erro ao buscar relatório');
    const dados = await resp.json();

    // Preenche cards
    document.getElementById('relArrecadacao').textContent =
      'R$ ' + (dados.arrecadacao || 0).toFixed(2).replace('.', ',');
    document.getElementById('relTotalFeitos').textContent = dados.totalAtendimentos || 0;
    document.getElementById('relTotalClientes').textContent = dados.rankingClientes.length;
    const ticketMedio = dados.totalAtendimentos > 0
      ? dados.arrecadacao / dados.totalAtendimentos : 0;
    document.getElementById('relTicketMedio').textContent =
      'R$ ' + ticketMedio.toFixed(2).replace('.', ',');

    document.getElementById('relCards').style.display = 'grid';

    // Preenche ranking
    const meses = ['','Janeiro','Fevereiro','Março','Abril','Maio','Junho',
      'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
    document.getElementById('relMesLabel').textContent = meses[mes] + ' / ' + ano;

    const rankWrap = document.getElementById('relRankingContent');
    if (dados.rankingClientes.length === 0) {
      rankWrap.innerHTML = `<div class="ap-empty" style="padding:40px">
        <p>Nenhum atendimento marcado como "Feito" neste mês</p>
      </div>`;
    } else {
      rankWrap.innerHTML = `<div style="overflow-x:auto"><table class="ag-table">
        <thead><tr>
          <th>#</th><th>Cliente</th><th>WhatsApp</th>
          <th>Atendimentos</th><th>Total Gasto</th>
        </tr></thead>
        <tbody>
        ${dados.rankingClientes.map((c, i) => `
          <tr>
            <td><span class="rank-pos rank-${i < 3 ? i+1 : 'other'}">${i + 1}º</span></td>
            <td class="td-nome"><strong>${c.nome}</strong></td>
            <td><a href="https://wa.me/55${(c.whatsapp||'').replace(/\D/g,'')}" target="_blank"
                   style="color:var(--gold);text-decoration:none;font-weight:500">📱 ${c.whatsapp}</a></td>
            <td><span class="quant-badge">${c.quantidade}x</span></td>
            <td class="td-valor">R$ ${c.totalGasto.toFixed(2).replace('.', ',')}</td>
          </tr>
        `).join('')}
        </tbody></table></div>`;
    }
    document.getElementById('relRankingWrap').style.display = 'block';

  } catch (e) {
    showToast('❌', `Erro ao carregar relatório: ${e.message}`);
    document.getElementById('relVazio').style.display = 'block';
  }
}

// ===== LOGOUT =====
function sairAdmin() {
  Auth.logout();
  window.location.replace('login.html');
}

// ===== TOAST =====
function showToast(icon, msg) {
  const t = document.getElementById('toast');
  document.getElementById('toastIcon').textContent = icon;
  document.getElementById('toastMsg').textContent  = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3500);
}

// ===== GERENCIAR SERVIÇOS =====
function renderListaServicos() {
  const cats = [...new Set(PROCEDIMENTOS.map(p => p.cat))];
  const wrap = document.getElementById('servicosLista');
  wrap.innerHTML = cats.map(cat => `
    <div class="sv-grupo">
      <div class="sv-grupo-titulo">${formatarCat(cat)}</div>
      ${PROCEDIMENTOS.filter(p => p.cat === cat).map(p => `
        <div class="sv-item" id="svi-${p.id}">
          <div class="sv-info">
            <span class="sv-nome">${p.nome}</span>
            <span class="sv-preco">R$ ${p.preco.toFixed(2).replace('.', ',')}</span>
          </div>
          <div class="sv-acoes">
            <button class="ac-btn editar" onclick="abrirEditarServico('${p.id}')">✏️ Editar</button>
            <button class="ac-btn excluir" onclick="excluirServico('${p.id}')">🗑</button>
          </div>
        </div>
      `).join('')}
    </div>
  `).join('');
}

function formatarCat(cat) {
  const mapa = { tradicional:'Tradicionais', alongamento:'Alongamentos',
    postica:'Postiças', gel:'Gel', pes:'Pés', manutencao:'Manutenção' };
  return mapa[cat] || cat;
}

let _editandoServId = null;

function abrirEditarServico(id) {
  const p = PROCEDIMENTOS.find(x => x.id === id);
  if (!p) return;
  _editandoServId = id;
  document.getElementById('svf-titulo').textContent = 'Editar Serviço';
  document.getElementById('svf-id').value           = p.id;
  document.getElementById('svf-id').disabled        = true;
  document.getElementById('svf-nome').value         = p.nome;
  document.getElementById('svf-preco').value        = p.preco;
  document.getElementById('svf-cat').value          = p.cat;
  document.getElementById('servicoFormOverlay').classList.add('active');
}

function abrirNovoServico() {
  _editandoServId = null;
  document.getElementById('svf-titulo').textContent = 'Novo Serviço';
  document.getElementById('svf-id').value           = '';
  document.getElementById('svf-id').disabled        = false;
  document.getElementById('svf-nome').value         = '';
  document.getElementById('svf-preco').value        = '';
  document.getElementById('svf-cat').value          = 'tradicional';
  document.getElementById('servicoFormOverlay').classList.add('active');
}

function fecharServicoForm() {
  document.getElementById('servicoFormOverlay').classList.remove('active');
}

async function salvarServico() {
  const id    = document.getElementById('svf-id').value.trim().replace(/\s+/g, '-').toLowerCase();
  const nome  = document.getElementById('svf-nome').value.trim();
  const preco = parseFloat(document.getElementById('svf-preco').value);
  const cat   = document.getElementById('svf-cat').value;

  if (!id || !nome || isNaN(preco) || preco < 0) {
    showToast('⚠️', 'Preencha todos os campos corretamente.');
    return;
  }

  try {
    if (_editandoServId) {
      await Servicos.editar(_editandoServId, { nome, preco, cat });
      const idx = PROCEDIMENTOS.findIndex(p => p.id === _editandoServId);
      if (idx !== -1) PROCEDIMENTOS[idx] = { ...PROCEDIMENTOS[idx], nome, preco, cat };
      showToast('💾', 'Serviço atualizado!');
    } else {
      if (PROCEDIMENTOS.find(p => p.id === id)) {
        showToast('⚠️', 'Já existe um serviço com esse ID.');
        return;
      }
      await Servicos.criar({ id, nome, preco, cat });
      PROCEDIMENTOS.push({ id, nome, preco, cat });
      showToast('✅', 'Serviço adicionado!');
    }
    fecharServicoForm();
    renderListaServicos();
  } catch (e) {
    showToast('❌', `Erro: ${e.message}`);
  }
}

async function excluirServico(id) {
  if (!confirm('Deseja excluir este serviço permanentemente?')) return;
  try {
    await Servicos.excluir(id);
    PROCEDIMENTOS = PROCEDIMENTOS.filter(p => p.id !== id);
    renderListaServicos();
    showToast('🗑', 'Serviço excluído.');
  } catch (e) {
    showToast('❌', `Erro: ${e.message}`);
  }
}

document.getElementById('servicoFormOverlay').addEventListener('click', e => {
  if (e.target === document.getElementById('servicoFormOverlay')) fecharServicoForm();
});
