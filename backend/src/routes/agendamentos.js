const express = require('express');
const auth    = require('../authMiddleware');
const db      = require('../supabase');

const router = express.Router();

// ─── PÚBLICO ────────────────────────────────────────────────

// POST /api/agendamentos — cliente cria agendamento
router.post('/', async (req, res) => {
  const { nome, whatsapp, procedimentos, total, data, hora } = req.body;

  if (!nome || !whatsapp || !procedimentos?.length || !data || !hora) {
    return res.status(400).json({ erro: 'Preencha todos os campos obrigatórios.' });
  }

  const partesNome = nome.trim().split(' ').filter(Boolean);
  if (partesNome.length < 2) {
    return res.status(400).json({ erro: 'Informe nome e sobrenome.' });
  }

  const hoje = new Date().toISOString().split('T')[0];
  if (data < hoje) {
    return res.status(400).json({ erro: 'Data inválida.' });
  }

  const { data: novo, error } = await db
    .from('agendamentos')
    .insert([{
      nome:          nome.trim(),
      whatsapp:      whatsapp.trim(),
      procedimentos,
      total,
      data,
      hora,
      status:        'pendente',
      criado_em:     new Date().toISOString()
    }])
    .select()
    .single();

  if (error) {
    console.error('Erro ao inserir agendamento:', error);
    return res.status(500).json({ erro: 'Erro ao salvar agendamento.' });
  }

  return res.status(201).json({ mensagem: 'Agendamento criado!', agendamento: novo });
});

// ─── ADMIN (requer token JWT) ────────────────────────────────

// ⚠️ IMPORTANTE: /stats e /relatorios DEVEM ficar antes de /:id

// GET /api/agendamentos/stats — números do dashboard
router.get('/stats', auth, async (req, res) => {
  const hoje = new Date().toISOString().split('T')[0];

  const { data: lista, error } = await db
    .from('agendamentos')
    .select('status, data');

  if (error) return res.status(500).json({ erro: 'Erro ao buscar stats.' });

  return res.json({
    total:      lista.length,
    hoje:       lista.filter(a => a.data === hoje).length,
    pendente:   lista.filter(a => a.status === 'pendente').length,
    confirmado: lista.filter(a => a.status === 'confirmado').length,
    feito:      lista.filter(a => a.status === 'feito').length
  });
});

// GET /api/agendamentos/relatorios — dados para relatórios
router.get('/relatorios', auth, async (req, res) => {
  const { mes, ano } = req.query;

  const mesAtual  = mes  ? parseInt(mes)  : new Date().getMonth() + 1;
  const anoAtual  = ano  ? parseInt(ano)  : new Date().getFullYear();

  // Monta intervalo do mês
  const dataInicio = `${anoAtual}-${String(mesAtual).padStart(2,'0')}-01`;
  const ultimoDia  = new Date(anoAtual, mesAtual, 0).getDate();
  const dataFim    = `${anoAtual}-${String(mesAtual).padStart(2,'0')}-${ultimoDia}`;

  const { data: lista, error } = await db
    .from('agendamentos')
    .select('*')
    .gte('data', dataInicio)
    .lte('data', dataFim)
    .eq('status', 'feito');

  if (error) return res.status(500).json({ erro: 'Erro ao buscar relatórios.' });

  // Relatório 1: arrecadação total do mês
  const arrecadacao = lista.reduce((soma, a) => soma + (parseFloat(a.total) || 0), 0);

  // Relatório 2: quantidade de atendimentos por cliente
  const porCliente = {};
  lista.forEach(a => {
    const nome = a.nome;
    if (!porCliente[nome]) {
      porCliente[nome] = { nome, whatsapp: a.whatsapp, quantidade: 0, totalGasto: 0 };
    }
    porCliente[nome].quantidade++;
    porCliente[nome].totalGasto += parseFloat(a.total) || 0;
  });

  const rankingClientes = Object.values(porCliente)
    .sort((a, b) => b.quantidade - a.quantidade);

  return res.json({
    mes: mesAtual,
    ano: anoAtual,
    arrecadacao,
    totalAtendimentos: lista.length,
    rankingClientes
  });
});

// GET /api/agendamentos — lista com filtros opcionais
router.get('/', auth, async (req, res) => {
  const { nome, data, status } = req.query;

  let query = db.from('agendamentos').select('*').order('data', { ascending: false });

  if (nome)   query = query.ilike('nome', `%${nome}%`);
  if (data)   query = query.eq('data', data);
  if (status) query = query.eq('status', status);

  const { data: lista, error } = await query;
  if (error) return res.status(500).json({ erro: 'Erro ao buscar agendamentos.' });

  return res.json(lista);
});

// PATCH /api/agendamentos/:id/status — aprovar, cancelar ou marcar como feito
router.patch('/:id/status', auth, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const statusPermitidos = ['pendente', 'confirmado', 'cancelado', 'feito'];
  if (!statusPermitidos.includes(status)) {
    return res.status(400).json({ erro: 'Status inválido.' });
  }

  const { data: atualizado, error } = await db
    .from('agendamentos')
    .update({ status })
    .eq('id', id)
    .select()
    .single();

  if (error) return res.status(500).json({ erro: 'Erro ao atualizar status.' });
  return res.json(atualizado);
});

// PUT /api/agendamentos/:id — editar agendamento completo
router.put('/:id', auth, async (req, res) => {
  const { id } = req.params;
  const { data, hora, procedimentos, total } = req.body;

  if (!data || !hora || !procedimentos?.length) {
    return res.status(400).json({ erro: 'Dados incompletos.' });
  }

  const { data: atualizado, error } = await db
    .from('agendamentos')
    .update({ data, hora, procedimentos, total })
    .eq('id', id)
    .select()
    .single();

  if (error) return res.status(500).json({ erro: 'Erro ao editar agendamento.' });
  return res.json(atualizado);
});

// DELETE /api/agendamentos/:id
router.delete('/:id', auth, async (req, res) => {
  const { id } = req.params;

  const { error } = await db
    .from('agendamentos')
    .delete()
    .eq('id', id);

  if (error) return res.status(500).json({ erro: 'Erro ao excluir.' });
  return res.json({ mensagem: 'Excluído com sucesso.' });
});

module.exports = router;
