-- ============================================
-- Seed: 3 partidos de ejemplo para desarrollo
-- ============================================

-- Partido 1: destacado, próximo
INSERT INTO matches (id, rival, date, venue, competition, is_featured, is_active)
VALUES (
  'a1111111-1111-1111-1111-111111111111',
  'Regatas de Mendoza',
  (now() + interval '5 days')::timestamptz,
  'Polideportivo Talleres',
  'FSP Masculino',
  true,
  true
);

INSERT INTO ticket_types (match_id, name, price, quota, sort_order) VALUES
  ('a1111111-1111-1111-1111-111111111111', 'Entrada', 4000.00, 300, 1);

-- Partido 2: próximo, no destacado
INSERT INTO matches (id, rival, date, venue, competition, is_featured, is_active)
VALUES (
  'b2222222-2222-2222-2222-222222222222',
  'Jockey Club',
  (now() + interval '12 days')::timestamptz,
  'Polideportivo Talleres',
  'Serie A',
  false,
  true
  );

INSERT INTO ticket_types (match_id, name, price, quota, sort_order) VALUES
  ('b2222222-2222-2222-2222-222222222222', 'Entrada', 4000.00, 300, 1);

-- Partido 3: formativas, pocas entradas
INSERT INTO matches (id, rival, date, venue, competition, is_featured, is_active)
VALUES (
  'c3333333-3333-3333-3333-333333333333',
  'Cementista',
  (now() + interval '20 days')::timestamptz,
  'Polideportivo Talleres',
  'Categorías Formativas',
  false,
  true
);

INSERT INTO ticket_types (match_id, name, price, quota, sold, sort_order) VALUES
  ('c3333333-3333-3333-3333-333333333333', 'Entrada', 4000.00, 150, 140, 1);
