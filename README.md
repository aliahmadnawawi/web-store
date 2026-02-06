# Sebelas Indonesia

![Sebelas Indonesia Banner](docs/banner.svg)

[![build](https://img.shields.io/badge/build-ready-brightgreen)](#) [![stack](https://img.shields.io/badge/stack-React%20%7C%20Java%20%7C%20Go%20%7C%20Python-blue)](#) [![license](https://img.shields.io/badge/license-MIT-lightgrey)](#)

Sebelas Indonesia is a mobile-first digital products marketplace with guest checkout, auto-delivery, and an AI-driven home feed.

**Brand color:** `#038383`

## Features

- Mobile-first, thumb-friendly UI with bento grid, carousel, and sticky navigation
- Guest checkout with minimal input (WhatsApp or email)
- Member accounts with order history and wishlist
- Unique invoice URLs for secure delivery access
- Auto-delivery for digital codes, files, or services
- Tripay payment gateway with signature-verified webhook handling
- MySQL + PostgreSQL + Redis hybrid storage
- AI services for recommendation and fraud detection
- PWA support (installable, offline, push-ready)
- SEO-ready JSON-LD, sitemap, robots.txt, canonical tags
- Google Merchant Center feed template (XML) for automated sync
- API docs and flow diagrams in `docs/`

## Architecture

```
apps/
  web/            Next.js + Tailwind web app
  mobile/         React Native (Expo) app
  admin/          Tabler-based admin panel
services/
  catalog-go/     Go service (catalog, inventory, search)
  orders-java/    Java service (checkout, payments, invoices)
  ai-python/      Python service (recommendation, fraud)
infra/
  docker-compose.yml
  docker-compose.app.yml
  app.env.example
docs/
  merchant-feed.xml

## Deployment (Docker)

1. Start databases + Redis:
   - `docker compose -f infra/docker-compose.yml up -d --build`
2. Copy env template and edit secrets:
   - `cp infra/app.env.example infra/app.env`
3. Start app services:
   - `docker compose --env-file infra/app.env -f infra/docker-compose.app.yml up -d --build`
  api.md
  flows.md
  merchant.md
  security.md
  tripay.md
tools/
  image-optimizer/ (Sharp-based image to WebP)
```

## Feature Matrix

| Area | Highlights |
|---|---|
| Web UI | Bento grid, carousel, flash sale, sticky header, bottom nav, micro-interactions |
| Checkout | Guest and member flows, unique invoice URL, auto-delivery |
| Payments | Tripay webhook signature verification, unique code, idempotency |
| AI | Personalized home feed + fraud scoring |
| Data | MySQL (catalog), PostgreSQL (orders), Redis (cache) |
| SEO | JSON-LD Product/Offer, sitemap, robots, canonical |
| Security | JWT, CORS, CSRF, rate limits, CSP, X-Frame-Options |
| Merchant Center | Scheduled feed or Content API sync |

## Quick Start

### 1) Databases and cache

```bash
cd infra

docker compose up -d
```

### 2) Web app

```bash
cd apps/web
npm install
npm run dev
```

### 3) Go catalog service

```bash
cd services/catalog-go

go mod tidy

go run ./cmd/api
```

### 4) Java orders service

```bash
cd services/orders-java

./mvnw spring-boot:run
```

### 5) Python AI service

```bash
cd services/ai-python

python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload
```

## Environment Variables

See `.env.example` in each service for details.
Core payment and delivery keys live in `services/orders-java/.env.example`.

## SEO & Indexing

- Index: home, categories, product detail, blog (optional)
- Disallow: checkout, cart, admin, login, invoice
- JSON-LD includes Product, Offer, and BreadcrumbList

## License

MIT

## Docs
- `docs/api.md`
- `docs/flows.md`
- `docs/sql/mysql_catalog.sql`
- `docs/sql/postgres_orders.sql`
