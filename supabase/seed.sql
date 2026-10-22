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
  'Liga Mendocina de Futsal',
  true,
  true
);

INSERT INTO ticket_types (match_id, name, price, quota, sort_order) VALUES
  ('a1111111-1111-1111-1111-111111111111', 'General', 3000.00, 200, 1),
  ('a1111111-1111-1111-1111-111111111111', 'Socio', 1500.00, 100, 2),
  ('a1111111-1111-1111-1111-111111111111', 'Platea', 5000.00, 50, 3);

-- Partido 2: próximo, no destacado
INSERT INTO matches (id, rival, date, venue, competition, is_featured, is_active)
VALUES (
  'b2222222-2222-2222-2222-222222222222',
  'Huracán Las Heras',
  (now() + interval '12 days')::timestamptz,
  'Polideportivo Talleres',
  'Liga Mendocina de Futsal',
  false,
  true
);

INSERT INTO ticket_types (match_id, name, price, quota, sort_order) VALUES
  ('b2222222-2222-2222-2222-222222222222', 'General', 3000.00, 180, 1),
  ('b2222222-2222-2222-2222-222222222222', 'Socio', 1500.00, 80, 2);

-- Partido 3: pocas entradas (para probar "Últimas entradas")
INSERT INTO matches (id, rival, date, venue, competition, is_featured, is_active)
VALUES (
  'c3333333-3333-3333-3333-333333333333',
  'Godoy Cruz Futsal',
  (now() + interval '20 days')::timestamptz,
  'Gimnasio Municipal Guaymallén',
  'Copa Mendoza',
  false,
  true
);

INSERT INTO ticket_types (match_id, name, price, quota, sold, sort_order) VALUES
  ('c3333333-3333-3333-3333-333333333333', 'General', 2500.00, 100, 92, 1),
  ('c3333333-3333-3333-3333-333333333333', 'Platea', 4500.00, 30, 27, 2);
