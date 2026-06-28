# 🌸 Grazy Nails — Backend

API REST em Node.js + Express com banco de dados no Supabase.

---

## 📁 Estrutura

```
grazy-backend/
├── src/
│   ├── server.js              ← entrada principal
│   ├── supabase.js            ← cliente do banco
│   ├── authMiddleware.js      ← verifica JWT
│   └── routes/
│       ├── auth.js            ← POST /api/auth/login
│       ├── agendamentos.js    ← CRUD de agendamentos
│       └── servicos.js        ← CRUD de serviços
├── supabase_setup.sql         ← rode no Supabase uma vez
├── frontend_api.js            ← copie para public/js/api.js
├── gerar_hash.js              ← gera hash da senha
├── .env.example               ← modelo do .env
└── package.json
```

---

## 🚀 Passo a passo de deploy

### 1. Supabase (banco de dados)

1. Crie conta em https://supabase.com e um novo projeto
2. Vá em **SQL Editor** e cole o conteúdo de `supabase_setup.sql`
3. Clique em **Run** — as tabelas e dados iniciais serão criados
4. Vá em **Settings → API** e anote:
   - `URL do projeto` → `SUPABASE_URL`
   - `service_role` (secret) → `SUPABASE_SERVICE_KEY`

### 2. Gerar hash da senha do admin

```bash
npm install
node gerar_hash.js SUA_SENHA_ESCOLHIDA
# Copie o hash gerado para usar no .env
```

### 3. Criar o arquivo .env

```bash
cp .env.example .env
# Edite .env com seus valores reais
```

Exemplo preenchido:
```
SUPABASE_URL=https://abcdefghij.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGci...
JWT_SECRET=uma_string_aleatoria_muito_longa_e_segura
ADMIN_USER=grazy
ADMIN_PASS_HASH=$2a$10$...hash_gerado_acima...
PORT=3000
FRONTEND_URL=https://seu-site.netlify.app
```

### 4. Testar localmente

```bash
npm run dev
# API rodando em http://localhost:3000
# Teste: GET http://localhost:3000/health
```

### 5. Deploy no Render (gratuito)

1. Suba o código para um repositório no GitHub (sem o `.env`!)
2. Acesse https://render.com → **New Web Service**
3. Conecte o repositório
4. Configure:
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Environment:** Node
5. Em **Environment Variables**, adicione cada variável do `.env`
6. Clique em **Deploy** — a URL será algo como `https://grazy-nails.onrender.com`

### 6. Atualizar o frontend

No arquivo `public/js/frontend_api.js` (que você copiou de `frontend_api.js`), troque:
```js
const API_URL = 'https://SEU-BACKEND.onrender.com';
```
pela URL real que o Render gerou.

#### No login.js — substitua `fazerLogin()` por:
```js
async function fazerLogin() {
  const u   = document.getElementById('adminUser').value.trim();
  const p   = document.getElementById('adminPass').value;
  const err = document.getElementById('loginError');
  const btn = document.getElementById('loginBtn');

  err.classList.remove('show');
  btn.disabled = true;
  btn.textContent = 'Entrando…';

  try {
    await Auth.login(u, p);
    sessionStorage.setItem('grazy_admin_auth', 'ok'); // compatibilidade
    btn.textContent = '✓ Autenticado — redirecionando…';
    setTimeout(() => window.location.replace('admin.html'), 600);
  } catch (e) {
    err.classList.add('show');
    document.getElementById('adminPass').value = '';
    btn.disabled = false;
    btn.textContent = '🔐 Entrar no painel';
  }
}
```

#### No admin.js — substitua as funções de dados:
```js
// Antes (localStorage):
// function getAgs(){ return JSON.parse(localStorage.getItem(KEY)||'[]'); }

// Depois (API):
async function getAgs(filtros = {}) {
  return await Agendamentos.listar(filtros);
}

async function atualizarStats() {
  const s = await Agendamentos.stats();
  document.getElementById('sTotal').textContent      = s.total;
  document.getElementById('sHoje').textContent       = s.hoje;
  document.getElementById('sPendente').textContent   = s.pendente;
  document.getElementById('sConfirmado').textContent = s.confirmado;
}
```

#### No script.js — substitua `enviarAgendamento()` para usar a API:
```js
// Onde antes fazia: lista.push(ag); saveAgs(lista);
// Faça:
await Agendamentos.criar({
  nome, whatsapp: whats, procedimentos: sels.map(p => p.id),
  total, data, hora
});
```

---

## 🔑 Endpoints resumidos

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| POST | `/api/auth/login` | ❌ | Login admin |
| GET | `/api/auth/verificar` | ✅ | Valida token |
| GET | `/api/servicos` | ❌ | Lista serviços (público) |
| POST | `/api/servicos` | ✅ | Cria serviço |
| PUT | `/api/servicos/:id` | ✅ | Edita serviço |
| DELETE | `/api/servicos/:id` | ✅ | Exclui serviço |
| POST | `/api/agendamentos` | ❌ | Cliente agenda |
| GET | `/api/agendamentos` | ✅ | Lista (com filtros) |
| GET | `/api/agendamentos/stats` | ✅ | Números do dashboard |
| PATCH | `/api/agendamentos/:id/status` | ✅ | Aprovar/cancelar |
| PUT | `/api/agendamentos/:id` | ✅ | Editar agendamento |
| DELETE | `/api/agendamentos/:id` | ✅ | Excluir |
