const express  = require('express');
const bcrypt   = require('bcryptjs');
const jwt      = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');

const router = express.Router();

// Máximo 10 tentativas de login por 15 minutos por IP
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { erro: 'Muitas tentativas. Aguarde 15 minutos.' }
});

// POST /api/auth/login
router.post('/login', loginLimiter, async (req, res) => {
  const { usuario, senha } = req.body;

  if (!usuario || !senha) {
    return res.status(400).json({ erro: 'Usuário e senha são obrigatórios.' });
  }

  // Verifica usuário
  if (usuario !== process.env.ADMIN_USER) {
    return res.status(401).json({ erro: 'Credenciais inválidas.' });
  }

  // Verifica senha contra o hash bcrypt
  const senhaOk = await bcrypt.compare(senha, process.env.ADMIN_PASS_HASH);
  if (!senhaOk) {
    return res.status(401).json({ erro: 'Credenciais inválidas.' });
  }

  // Gera token JWT válido por 8 horas
  const token = jwt.sign(
    { usuario, role: 'admin' },
    process.env.JWT_SECRET,
    { expiresIn: '8h' }
  );

  return res.json({ token, expiraEm: '8h' });
});

// GET /api/auth/verificar  — checa se o token ainda é válido
router.get('/verificar', require('../authMiddleware'), (req, res) => {
  res.json({ valido: true, admin: req.admin });
});

module.exports = router;
