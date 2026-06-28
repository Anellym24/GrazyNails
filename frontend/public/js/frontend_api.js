// =============================================
// public/js/api.js  — cola na pasta do frontend
// Substitui as chamadas ao localStorage por
// chamadas reais à API do backend.
// =============================================

const API_URL = 'http://localhost:3000'; // ← troque pela URL do Render/Railway

// ─── TOKEN (salvo no sessionStorage como antes) ───────────────
function getToken() {
  return sessionStorage.getItem('grazy_admin_token');
}
function setToken(t) {
  sessionStorage.setItem('grazy_admin_token', t);
}
function removeToken() {
  sessionStorage.removeItem('grazy_admin_token');
}

function authHeaders() {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${getToken()}`
  };
}

// Trata erros HTTP de forma uniforme
async function handleResponse(res) {
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.erro || `Erro ${res.status}`);
  return json;
}

// ─── AUTH ─────────────────────────────────────────────────────
const Auth = {
  async login(usuario, senha) {
    const res = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usuario, senha })
    });
    const data = await handleResponse(res);
    setToken(data.token);
    return data;
  },

  async verificar() {
    const res = await fetch(`${API_URL}/api/auth/verificar`, {
      headers: authHeaders()
    });
    return res.ok;
  },

  logout() {
    removeToken();
  }
};

// ─── AGENDAMENTOS ─────────────────────────────────────────────
const Agendamentos = {
  // Público — chamado pelo script.js quando cliente agenda
  async criar(ag) {
    const res = await fetch(`${API_URL}/api/agendamentos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(ag)
    });
    return handleResponse(res);
  },

  // Admin
  async listar(filtros = {}) {
    const params = new URLSearchParams();
    if (filtros.nome)   params.set('nome',   filtros.nome);
    if (filtros.data)   params.set('data',   filtros.data);
    if (filtros.status) params.set('status', filtros.status);

    const res = await fetch(`${API_URL}/api/agendamentos?${params}`, {
      headers: authHeaders()
    });
    return handleResponse(res);
  },

  async stats() {
    const res = await fetch(`${API_URL}/api/agendamentos/stats`, {
      headers: authHeaders()
    });
    return handleResponse(res);
  },

  async atualizarStatus(id, status) {
    const res = await fetch(`${API_URL}/api/agendamentos/${id}/status`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify({ status })
    });
    return handleResponse(res);
  },

  async editar(id, dados) {
    const res = await fetch(`${API_URL}/api/agendamentos/${id}`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify(dados)
    });
    return handleResponse(res);
  },

  async excluir(id) {
    const res = await fetch(`${API_URL}/api/agendamentos/${id}`, {
      method: 'DELETE',
      headers: authHeaders()
    });
    return handleResponse(res);
  }
};

// ─── SERVIÇOS ─────────────────────────────────────────────────
const Servicos = {
  // Público — carregado pelo script.js na página inicial
  async listar() {
    const res = await fetch(`${API_URL}/api/servicos`);
    return handleResponse(res);
  },

  async criar(servico) {
    const res = await fetch(`${API_URL}/api/servicos`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(servico)
    });
    return handleResponse(res);
  },

  async editar(id, dados) {
    const res = await fetch(`${API_URL}/api/servicos/${id}`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify(dados)
    });
    return handleResponse(res);
  },

  async excluir(id) {
    const res = await fetch(`${API_URL}/api/servicos/${id}`, {
      method: 'DELETE',
      headers: authHeaders()
    });
    return handleResponse(res);
  }
};
