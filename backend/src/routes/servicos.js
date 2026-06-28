const express = require('express');
const auth    = require('../authMiddleware');
const db      = require('../supabase');

const router = express.Router();

// ─── PÚBLICO ────────────────────────────────────────────────

// GET /api/servicos — lista todos os serviços (usado pelo frontend)
router.get('/', async (req, res) => {
  const { data, error } = await db
    .from('servicos')
    .select('*')
    .order('cat')
    .order('nome');

  if (error) {
  console.error(error);
  return res.status(500).json(error);
}
  return res.json(data);
});

// ─── ADMIN ──────────────────────────────────────────────────

// POST /api/servicos — criar serviço
router.post('/', auth, async (req, res) => {
  const { id, nome, preco, cat } = req.body;

  if (!id || !nome || preco == null || !cat) {
    return res.status(400).json({ erro: 'Preencha todos os campos.' });
  }

  if (typeof preco !== 'number' || preco < 0) {
    return res.status(400).json({ erro: 'Preço inválido.' });
  }

  const { data: novo, error } = await db
    .from('servicos')
    .insert([{ id, nome, preco, cat }])
    .select()
    .single();

  if (error) {
    if (error.code === '23505') { // unique violation
      return res.status(409).json({ erro: 'Já existe um serviço com esse ID.' });
    }
    return res.status(500).json({ erro: 'Erro ao criar serviço.' });
  }

  return res.status(201).json(novo);
});

// PUT /api/servicos/:id — editar serviço
router.put('/:id', auth, async (req, res) => {
  const { id } = req.params;
  const { nome, preco, cat } = req.body;

  if (!nome || preco == null || !cat) {
    return res.status(400).json({ erro: 'Dados incompletos.' });
  }

  const { data: atualizado, error } = await db
    .from('servicos')
    .update({ nome, preco, cat })
    .eq('id', id)
    .select()
    .single();

  if (error) return res.status(500).json({ erro: 'Erro ao atualizar serviço.' });
  return res.json(atualizado);
});

// DELETE /api/servicos/:id
router.delete('/:id', auth, async (req, res) => {
  const { id } = req.params;

  const { error } = await db
    .from('servicos')
    .delete()
    .eq('id', id);

  if (error) return res.status(500).json({ erro: 'Erro ao excluir serviço.' });
  return res.json({ mensagem: 'Serviço excluído.' });
});

module.exports = router;
