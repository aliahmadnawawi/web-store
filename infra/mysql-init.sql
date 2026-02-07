CREATE TABLE IF NOT EXISTS categories (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  slug VARCHAR(120) NOT NULL UNIQUE,
  name VARCHAR(160) NOT NULL,
  icon VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS products (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  category_id BIGINT NOT NULL,
  slug VARCHAR(160) NOT NULL UNIQUE,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  price INT NOT NULL,
  status VARCHAR(40) DEFAULT 'ACTIVE',
  type VARCHAR(40) DEFAULT 'ACCOUNT',
  image_url VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id)
);

CREATE TABLE IF NOT EXISTS product_images (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  product_id BIGINT NOT NULL,
  url VARCHAR(255) NOT NULL,
  sort_order INT DEFAULT 0,
  FOREIGN KEY (product_id) REFERENCES products(id)
);

CREATE TABLE IF NOT EXISTS stocks (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  product_id BIGINT NOT NULL,
  payload TEXT NOT NULL,
  status VARCHAR(30) DEFAULT 'AVAILABLE',
  reserved_at TIMESTAMP NULL,
  sold_at TIMESTAMP NULL,
  invoice_id VARCHAR(120),
  FOREIGN KEY (product_id) REFERENCES products(id)
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  actor VARCHAR(120) NOT NULL,
  role VARCHAR(40) NOT NULL,
  action VARCHAR(80) NOT NULL,
  entity VARCHAR(80) NOT NULL,
  entity_id VARCHAR(120),
  meta TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS admin_users (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(120) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(40) DEFAULT 'editor',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Seed categories + sample premium products (safe to re-run on fresh DB init).
INSERT IGNORE INTO categories (slug, name, icon) VALUES
  ('streaming', 'Streaming', 'play'),
  ('premium-accounts', 'Akun Premium', 'spark'),
  ('apps-tools', 'Apps & Tools', 'tools'),
  ('software-license', 'Software License', 'key'),
  ('game-topup', 'Game Top Up', 'gamepad'),
  ('e-voucher', 'E-Voucher', 'ticket'),
  ('services', 'Jasa', 'bolt');

INSERT IGNORE INTO products (category_id, slug, name, description, price, status, type, image_url)
SELECT c.id, 'netflix-1-bulan-premium', 'Netflix 1 Bulan Premium', 'Akun premium shared. Auto delivery. Garansi 30 hari.', 39000, 'ACTIVE', 'ACCOUNT', '/products/netflix-1-bulan-premium.svg'
FROM categories c WHERE c.slug='streaming';

INSERT IGNORE INTO products (category_id, slug, name, description, price, status, type, image_url)
SELECT c.id, 'spotify-family-1-bulan', 'Spotify Family 1 Bulan', 'Invite family. Auto delivery. Garansi 30 hari.', 28000, 'ACTIVE', 'ACCOUNT', '/products/spotify-family-1-bulan.svg'
FROM categories c WHERE c.slug='streaming';

INSERT IGNORE INTO products (category_id, slug, name, description, price, status, type, image_url)
SELECT c.id, 'youtube-premium-1-bulan', 'YouTube Premium 1 Bulan', 'No ads + background play. Auto delivery.', 29000, 'ACTIVE', 'ACCOUNT', '/products/youtube-premium-1-bulan.svg'
FROM categories c WHERE c.slug='streaming';

INSERT IGNORE INTO products (category_id, slug, name, description, price, status, type, image_url)
SELECT c.id, 'disney-plus-1-bulan', 'Disney+ 1 Bulan', 'Akun premium. Auto delivery.', 35000, 'ACTIVE', 'ACCOUNT', '/products/disney-plus-1-bulan.svg'
FROM categories c WHERE c.slug='streaming';

INSERT IGNORE INTO products (category_id, slug, name, description, price, status, type, image_url)
SELECT c.id, 'prime-video-1-bulan', 'Prime Video 1 Bulan', 'Akun premium. Auto delivery.', 25000, 'ACTIVE', 'ACCOUNT', '/products/prime-video-1-bulan.svg'
FROM categories c WHERE c.slug='streaming';

INSERT IGNORE INTO products (category_id, slug, name, description, price, status, type, image_url)
SELECT c.id, 'viu-premium-1-bulan', 'Viu Premium 1 Bulan', 'Akun premium. Auto delivery.', 15000, 'ACTIVE', 'ACCOUNT', '/products/viu-premium-1-bulan.svg'
FROM categories c WHERE c.slug='streaming';

INSERT IGNORE INTO products (category_id, slug, name, description, price, status, type, image_url)
SELECT c.id, 'canva-pro-1-bulan', 'Canva Pro 1 Bulan', 'Canva Pro untuk desain. Auto delivery.', 19000, 'ACTIVE', 'ACCOUNT', '/products/canva-pro-1-bulan.svg'
FROM categories c WHERE c.slug='premium-accounts';

INSERT IGNORE INTO products (category_id, slug, name, description, price, status, type, image_url)
SELECT c.id, 'capcut-pro-1-bulan', 'CapCut Pro 1 Bulan', 'Unlock fitur premium. Auto delivery.', 25000, 'ACTIVE', 'ACCOUNT', '/products/capcut-pro-1-bulan.svg'
FROM categories c WHERE c.slug='apps-tools';

INSERT IGNORE INTO products (category_id, slug, name, description, price, status, type, image_url)
SELECT c.id, 'chatgpt-plus-1-bulan', 'ChatGPT Plus 1 Bulan', 'Akun premium. Auto delivery.', 199000, 'ACTIVE', 'ACCOUNT', '/products/chatgpt-plus-1-bulan.svg'
FROM categories c WHERE c.slug='apps-tools';

INSERT IGNORE INTO products (category_id, slug, name, description, price, status, type, image_url)
SELECT c.id, 'vpn-premium-1-bulan', 'VPN Premium 1 Bulan', 'Akses lebih cepat & stabil. Auto delivery.', 15000, 'ACTIVE', 'ACCOUNT', '/products/vpn-premium-1-bulan.svg'
FROM categories c WHERE c.slug='apps-tools';

INSERT IGNORE INTO products (category_id, slug, name, description, price, status, type, image_url)
SELECT c.id, 'microsoft-365-1-tahun', 'Microsoft 365 1 Tahun', 'Lisensi resmi. Aktivasi cepat.', 159000, 'ACTIVE', 'ACCOUNT', '/products/microsoft-365-1-tahun.svg'
FROM categories c WHERE c.slug='software-license';

INSERT IGNORE INTO products (category_id, slug, name, description, price, status, type, image_url)
SELECT c.id, 'windows-11-pro', 'Windows 11 Pro Key', 'Lisensi aktivasi. Instant delivery.', 99000, 'ACTIVE', 'ACCOUNT', '/products/windows-11-pro.svg'
FROM categories c WHERE c.slug='software-license';

INSERT IGNORE INTO products (category_id, slug, name, description, price, status, type, image_url)
SELECT c.id, 'adobe-cc-1-bulan', 'Adobe Creative Cloud 1 Bulan', 'Akun/akses premium. Auto delivery.', 89000, 'ACTIVE', 'ACCOUNT', '/products/adobe-cc-1-bulan.svg'
FROM categories c WHERE c.slug='apps-tools';

INSERT IGNORE INTO products (category_id, slug, name, description, price, status, type, image_url)
SELECT c.id, 'midjourney-1-bulan', 'Midjourney 1 Bulan', 'Akun premium. Auto delivery.', 129000, 'ACTIVE', 'ACCOUNT', '/products/midjourney-1-bulan.svg'
FROM categories c WHERE c.slug='apps-tools';

INSERT IGNORE INTO products (category_id, slug, name, description, price, status, type, image_url)
SELECT c.id, 'telegram-premium-1-bulan', 'Telegram Premium 1 Bulan', 'Akun premium. Auto delivery.', 35000, 'ACTIVE', 'ACCOUNT', '/products/telegram-premium-1-bulan.svg'
FROM categories c WHERE c.slug='premium-accounts';

INSERT IGNORE INTO products (category_id, slug, name, description, price, status, type, image_url)
SELECT c.id, 'mlbb-86-diamonds', 'MLBB 86 Diamonds', 'Top up instan. Fast process.', 22500, 'ACTIVE', 'SERVICE', '/products/mlbb-86-diamonds.svg'
FROM categories c WHERE c.slug='game-topup';

INSERT IGNORE INTO products (category_id, slug, name, description, price, status, type, image_url)
SELECT c.id, 'freefire-140-diamonds', 'Free Fire 140 Diamonds', 'Top up instan. Fast process.', 25000, 'ACTIVE', 'SERVICE', '/products/freefire-140-diamonds.svg'
FROM categories c WHERE c.slug='game-topup';

INSERT IGNORE INTO products (category_id, slug, name, description, price, status, type, image_url)
SELECT c.id, 'valorant-420-points', 'Valorant 420 Points', 'Top up instan. Fast process.', 52000, 'ACTIVE', 'SERVICE', '/products/valorant-420-points.svg'
FROM categories c WHERE c.slug='game-topup';

INSERT IGNORE INTO products (category_id, slug, name, description, price, status, type, image_url)
SELECT c.id, 'jasa-up-rank-mlbb', 'Jasa Up Rank MLBB', 'Joki rank aman. Estimasi 1-3 hari.', 120000, 'ACTIVE', 'SERVICE', '/products/jasa-up-rank-mlbb.svg'
FROM categories c WHERE c.slug='services';
