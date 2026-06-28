-- =============================================
-- Execute no SQL Editor do Supabase
-- https://supabase.com/dashboard/project/SEU_PROJETO/sql
-- =============================================

-- TABELA: servicos
CREATE TABLE IF NOT EXISTS servicos (
  id    TEXT PRIMARY KEY,          -- ex: 'fibra-vidro'
  nome  TEXT NOT NULL,
  preco NUMERIC(8,2) NOT NULL CHECK (preco >= 0),
  cat   TEXT NOT NULL              -- tradicional | alongamento | postica | gel | pes | manutencao
);

-- Dados iniciais (os mesmos do frontend)
INSERT INTO servicos (id, nome, preco, cat) VALUES
  ('pe-mao-simples',    'Pé e Mão Simples',             45,  'tradicional'),
  ('francesinha',       'Francesinha',                   48,  'tradicional'),
  ('decoradas-mao',     'Decoradas à Mão',               56,  'tradicional'),
  ('decoradas-adesivo', 'Decoradas com Adesivos',        52,  'tradicional'),
  ('cutilegam-base',    'Cutílegam + Base Comum',        36,  'tradicional'),
  ('cutilegam-top',     'Cutílegam + Top Coat',          38,  'tradicional'),
  ('fibra-vidro',       'Fibra de Vidro',                140, 'alongamento'),
  ('acrygel',           'Acrygel',                       130, 'alongamento'),
  ('banho-gel',         'Banho de Gel',                  100, 'alongamento'),
  ('postica-simples',   'Postiça Simples',               40,  'postica'),
  ('postica-dec',       'Postiça Realista Decorada',     60,  'postica'),
  ('postica-enc',       'Postiça Realista Encapsulada',  70,  'postica'),
  ('gel-simples',       'Esmaltação em Gel – Simples',   30,  'gel'),
  ('gel-decorada',      'Esmaltação em Gel – Decorada',  38,  'gel'),
  ('pe-esfo-motor',     'Pé + Esfoliação + Motor',      40,  'pes'),
  ('pe-mao-esfo',       'Pé e Mão + Esfoliação',        60,  'pes'),
  ('pe-motor',          'Pé + Motor',                    28,  'pes'),
  ('plastica-pes',      'Plástica dos Pés + Esm.',      70,  'pes'),
  ('manut-fibra',       'Manutenção Fibra/Acrylgel',    95,  'manutencao'),
  ('reposicao',         'Reposição de Unhas',            5,   'manutencao')
ON CONFLICT (id) DO NOTHING;


-- TABELA: agendamentos
CREATE TABLE IF NOT EXISTS agendamentos (
  id             BIGSERIAL PRIMARY KEY,
  nome           TEXT NOT NULL,
  whatsapp       TEXT NOT NULL,
  procedimentos  TEXT[] NOT NULL,          -- array de IDs: {'fibra-vidro','gel-simples'}
  total          NUMERIC(8,2) NOT NULL,
  data           DATE NOT NULL,
  hora           TEXT NOT NULL,            -- ex: '14:30'
  status         TEXT NOT NULL DEFAULT 'pendente'
                   CHECK (status IN ('pendente','confirmado','cancelado')),
  criado_em      TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para buscas comuns no painel
CREATE INDEX IF NOT EXISTS idx_ag_data   ON agendamentos (data);
CREATE INDEX IF NOT EXISTS idx_ag_status ON agendamentos (status);
CREATE INDEX IF NOT EXISTS idx_ag_nome   ON agendamentos USING gin (to_tsvector('portuguese', nome));


-- ─── ROW LEVEL SECURITY ───────────────────────────────────────
-- O backend usa a service_role key, que ignora RLS.
-- Mesmo assim, habilitamos RLS para bloquear acesso direto.

ALTER TABLE agendamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE servicos     ENABLE ROW LEVEL SECURITY;

-- Bloqueia tudo via cliente anon (chave pública)
-- O backend com service_role passa por cima disso
CREATE POLICY "Negar acesso público a agendamentos"
  ON agendamentos FOR ALL TO anon USING (false);

CREATE POLICY "Leitura pública de serviços"
  ON servicos FOR SELECT TO anon USING (true);

CREATE POLICY "Escrita de serviços apenas via service_role"
  ON servicos FOR ALL TO anon USING (false);
