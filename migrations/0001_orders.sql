-- Online orders (Stripe) and the stock they hold. One row per Stripe Checkout session.
CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,                 -- our hold id (uuid)
  stripe_session TEXT UNIQUE,          -- cs_... once Stripe has created the session
  status TEXT NOT NULL DEFAULT 'pending',   -- pending | paid | expired | failed
  pay_mode TEXT NOT NULL,              -- online | ship
  name TEXT, contact TEXT, market TEXT, ship_to TEXT, notes TEXT,
  items_json TEXT NOT NULL,
  total_cents INTEGER NOT NULL DEFAULT 0, ship_cents INTEGER NOT NULL DEFAULT 0,
  payment_intent TEXT,
  created_at INTEGER NOT NULL, paid_at INTEGER
);
-- Plants held for an order. A 'hold' lasts while the customer is paying; a 'paid' hold lasts until the Dropbox sheet shows the sale (or 7 days).
CREATE TABLE IF NOT EXISTS reservations (
  order_id TEXT NOT NULL, sku TEXT NOT NULL, qty INTEGER NOT NULL,
  sheet_stock INTEGER NOT NULL,        -- stock the sheet showed when the order was placed
  state TEXT NOT NULL DEFAULT 'hold',  -- hold | paid
  expires_at INTEGER NOT NULL,
  PRIMARY KEY (order_id, sku)
);
CREATE INDEX IF NOT EXISTS reservations_sku ON reservations (sku);
