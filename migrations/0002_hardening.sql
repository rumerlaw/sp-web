-- Repeat-click protection and a rate limit that works across all Cloudflare locations (IPs are stored only as a one-way hash).
ALTER TABLE orders ADD COLUMN req_hash TEXT;
CREATE INDEX IF NOT EXISTS orders_req ON orders (req_hash, created_at);
CREATE TABLE IF NOT EXISTS rate (k TEXT PRIMARY KEY, n INTEGER NOT NULL, exp INTEGER NOT NULL);
