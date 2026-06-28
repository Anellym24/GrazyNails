-- =============================================
-- ATUALIZAÇÃO: Adicionar status 'feito'
-- Execute no SQL Editor do Supabase
-- =============================================

-- Atualiza o CHECK constraint para incluir 'feito'
ALTER TABLE agendamentos DROP CONSTRAINT IF EXISTS agendamentos_status_check;
ALTER TABLE agendamentos ADD CONSTRAINT agendamentos_status_check
  CHECK (status IN ('pendente','confirmado','cancelado','feito'));

-- Índice para buscas por mês (relatórios)
CREATE INDEX IF NOT EXISTS idx_ag_data_status ON agendamentos (data, status);
