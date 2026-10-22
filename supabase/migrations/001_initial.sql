-- ============================================
-- Andes Talleres Futsal - Entradas
-- Migración inicial: tablas, RLS, funciones
-- ============================================

-- Extensión para UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABLA: matches (partidos)
-- ============================================
CREATE TABLE matches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rival TEXT NOT NULL,
  rival_shield_url TEXT,
  date TIMESTAMPTZ NOT NULL,
  venue TEXT NOT NULL DEFAULT 'Polideportivo Talleres',
  competition TEXT NOT NULL DEFAULT 'Liga Mendocina de Futsal',
  image_url TEXT,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- TABLA: ticket_types (tipos de entrada)
-- ============================================
CREATE TABLE ticket_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  name TEXT NOT NULL,            -- 'General', 'Socio', 'Platea'
  price NUMERIC(10,2) NOT NULL CHECK (price >= 0),
  quota INTEGER NOT NULL CHECK (quota >= 0),         -- cupo total
  sold INTEGER NOT NULL DEFAULT 0 CHECK (sold >= 0), -- vendidos
  reserved INTEGER NOT NULL DEFAULT 0 CHECK (reserved >= 0), -- reservados temporalmente
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT stock_check CHECK (sold + reserved <= quota)
);

-- ============================================
-- TABLA: orders (órdenes de compra)
-- ============================================
CREATE TYPE order_status AS ENUM ('pending', 'approved', 'rejected', 'expired');

CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id UUID NOT NULL REFERENCES matches(id),
  buyer_name TEXT NOT NULL,
  buyer_email TEXT NOT NULL,
  buyer_dni TEXT NOT NULL,
  total NUMERIC(10,2) NOT NULL,
  status order_status NOT NULL DEFAULT 'pending',
  mp_preference_id TEXT,
  mp_payment_id TEXT,
  mp_merchant_order_id TEXT,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,  -- snapshot de items [{ticket_type_id, name, qty, price}]
  email_sent BOOLEAN NOT NULL DEFAULT false,
  email_error TEXT,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '10 minutes'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- TABLA: tickets (entradas individuales)
-- ============================================
CREATE TABLE tickets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  match_id UUID NOT NULL REFERENCES matches(id),
  ticket_type_id UUID NOT NULL REFERENCES ticket_types(id),
  code TEXT NOT NULL UNIQUE,       -- código único legible (ej: ATSC-XXXX-XXXX)
  token TEXT NOT NULL UNIQUE,      -- token HMAC para el QR
  holder_name TEXT,
  is_used BOOLEAN NOT NULL DEFAULT false,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- ÍNDICES
-- ============================================
CREATE INDEX idx_matches_date ON matches(date);
CREATE INDEX idx_matches_active ON matches(is_active, date);
CREATE INDEX idx_ticket_types_match ON ticket_types(match_id);
CREATE INDEX idx_orders_match ON orders(match_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_buyer ON orders(buyer_email, buyer_dni);
CREATE INDEX idx_orders_mp_payment ON orders(mp_payment_id);
CREATE INDEX idx_orders_expires ON orders(status, expires_at);
CREATE INDEX idx_tickets_order ON tickets(order_id);
CREATE INDEX idx_tickets_code ON tickets(code);
CREATE INDEX idx_tickets_token ON tickets(token);
CREATE INDEX idx_tickets_match ON tickets(match_id);

-- ============================================
-- FUNCIÓN: reservar stock atómicamente
-- ============================================
CREATE OR REPLACE FUNCTION reserve_stock(
  p_ticket_type_id UUID,
  p_quantity INTEGER
) RETURNS BOOLEAN AS $$
DECLARE
  v_available INTEGER;
BEGIN
  -- Lock the row for update
  SELECT quota - sold - reserved INTO v_available
  FROM ticket_types
  WHERE id = p_ticket_type_id
  FOR UPDATE;

  IF v_available IS NULL THEN
    RETURN false;
  END IF;

  IF v_available < p_quantity THEN
    RETURN false;
  END IF;

  UPDATE ticket_types
  SET reserved = reserved + p_quantity,
      updated_at = now()
  WHERE id = p_ticket_type_id;

  RETURN true;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- FUNCIÓN: confirmar reserva (mover de reserved a sold)
-- ============================================
CREATE OR REPLACE FUNCTION confirm_reservation(
  p_ticket_type_id UUID,
  p_quantity INTEGER
) RETURNS BOOLEAN AS $$
BEGIN
  UPDATE ticket_types
  SET reserved = reserved - p_quantity,
      sold = sold + p_quantity,
      updated_at = now()
  WHERE id = p_ticket_type_id
    AND reserved >= p_quantity;

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- FUNCIÓN: liberar reserva expirada
-- ============================================
CREATE OR REPLACE FUNCTION release_reservation(
  p_ticket_type_id UUID,
  p_quantity INTEGER
) RETURNS BOOLEAN AS $$
BEGIN
  UPDATE ticket_types
  SET reserved = GREATEST(reserved - p_quantity, 0),
      updated_at = now()
  WHERE id = p_ticket_type_id;

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- FUNCIÓN: limpiar reservas expiradas (cron o invocación manual)
-- ============================================
CREATE OR REPLACE FUNCTION cleanup_expired_reservations() RETURNS void AS $$
DECLARE
  r RECORD;
  item RECORD;
BEGIN
  FOR r IN
    SELECT id, items
    FROM orders
    WHERE status = 'pending'
      AND expires_at < now()
  LOOP
    -- Liberar stock para cada item de la orden
    FOR item IN SELECT * FROM jsonb_array_elements(r.items) AS elem
    LOOP
      PERFORM release_reservation(
        (item.elem->>'ticket_type_id')::UUID,
        (item.elem->>'qty')::INTEGER
      );
    END LOOP;

    -- Marcar la orden como expirada
    UPDATE orders SET status = 'expired', updated_at = now() WHERE id = r.id;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- FUNCIÓN: updated_at automático
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_matches_updated_at
  BEFORE UPDATE ON matches
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER tr_ticket_types_updated_at
  BEFORE UPDATE ON ticket_types
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER tr_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

-- matches: público puede leer partidos activos
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read active matches"
  ON matches FOR SELECT
  USING (is_active = true);

CREATE POLICY "Service role full access on matches"
  ON matches FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Authenticated users (admins) can manage matches
CREATE POLICY "Authenticated users can manage matches"
  ON matches FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- ticket_types: público puede leer tipos activos
ALTER TABLE ticket_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read active ticket types"
  ON ticket_types FOR SELECT
  USING (is_active = true);

CREATE POLICY "Service role full access on ticket_types"
  ON ticket_types FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Authenticated users can manage ticket_types"
  ON ticket_types FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- orders: solo server-side
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on orders"
  ON orders FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Authenticated users can read orders"
  ON orders FOR SELECT
  USING (auth.role() = 'authenticated');

-- tickets: solo server-side
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on tickets"
  ON tickets FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Authenticated users can read tickets"
  ON tickets FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update tickets"
  ON tickets FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');
