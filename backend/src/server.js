require('dotenv').config();
const express    = require('express');
const cors       = require('cors');
const rateLimit  = require('express-rate-limit');

const authRoutes         = require('./routes/auth');
const agendamentosRoutes = require('./routes/agendamentos');
const servicosRoutes     = require('./routes/servicos');

const app  = express();
const PORT = process.env.PORT || 3000;

// ─── CORS ────────────────────────────────────────────────────
// Lê FRONTEND_URL do .env — pode ser uma única origem ou várias
// separadas por vírgula. Ex: http://localhost:5500,http://127.0.0.1:5501
const origensPermitidas = (process.env.FRONTEND_URL || '')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Permite requisições sem origin (ex: Postman, curl) em dev
    if (!origin) return callback(null, true);
    // Em produção sem FRONTEND_URL configurado, bloqueia tudo
    if (origensPermitidas.length === 0) return callback(null, false);
    // Libera se a origem estiver na lista
    if (origensPermitidas.includes(origin)) return callback(null, true);
    callback(new Error(`Origem não permitida pelo CORS: ${origin}`));
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// ─── RATE LIMIT GLOBAL ───────────────────────────────────────
app.use(rateLimit({
  windowMs: 60 * 1000,   // 1 minuto
  max: 60,               // máx 60 req/min por IP
  message: { erro: 'Muitas requisições. Tente em breve.' }
}));

// ─── BODY PARSER ─────────────────────────────────────────────
app.use(express.json());

// ─── HEALTH CHECK ────────────────────────────────────────────
app.get('/health', (_req, res) => res.json({ status: 'ok' }));

// ─── ROTAS ───────────────────────────────────────────────────
app.use('/api/auth',         authRoutes);
app.use('/api/agendamentos', agendamentosRoutes);
app.use('/api/servicos',     servicosRoutes);

// ─── 404 ─────────────────────────────────────────────────────
app.use((_req, res) => res.status(404).json({ erro: 'Rota não encontrada.' }));

// ─── ERRO GLOBAL ─────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error('Erro não tratado:', err);
  res.status(500).json({ erro: 'Erro interno do servidor.' });
});

// ─── START ───────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`✅ Servidor rodando na porta ${PORT}`);
  console.log(`   Origens permitidas: ${origensPermitidas.join(', ') || '(nenhuma — configure FRONTEND_URL)'}`);
});