CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY,
  email VARCHAR(160) UNIQUE,
  password_hash VARCHAR(255),
  role VARCHAR(40) DEFAULT 'MEMBER',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY,
  invoice_code VARCHAR(60) UNIQUE NOT NULL,
  token VARCHAR(120) UNIQUE NOT NULL,
  status VARCHAR(30) DEFAULT 'PENDING',
  amount INT NOT NULL,
  product_id VARCHAR(120),
  contact VARCHAR(160),
  member_id UUID,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY,
  invoice_id UUID NOT NULL,
  status VARCHAR(30) DEFAULT 'PENDING',
  created_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (invoice_id) REFERENCES invoices(id)
);

CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY,
  order_id UUID NOT NULL,
  product_id VARCHAR(120) NOT NULL,
  product_name VARCHAR(200) NOT NULL,
  price INT NOT NULL,
  qty INT DEFAULT 1,
  FOREIGN KEY (order_id) REFERENCES orders(id)
);

CREATE TABLE IF NOT EXISTS deliveries (
  id UUID PRIMARY KEY,
  invoice_id UUID NOT NULL,
  payload TEXT,
  channel VARCHAR(60),
  sent_at TIMESTAMP,
  FOREIGN KEY (invoice_id) REFERENCES invoices(id)
);

CREATE TABLE IF NOT EXISTS wishlists (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  product_id VARCHAR(120) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY,
  actor VARCHAR(120) NOT NULL,
  role VARCHAR(40) NOT NULL,
  action VARCHAR(80) NOT NULL,
  entity VARCHAR(80) NOT NULL,
  entity_id VARCHAR(120),
  meta TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
