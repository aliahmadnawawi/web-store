# API Overview

## Catalog Service (Go)
- `GET /categories`
- `GET /products`
- `GET /products/:slug`
- `POST /products`
- `POST /stock/import`
- `POST /stock/allocate`
- `GET /feed.xml`

## Orders Service (Java)
- `POST /checkout/guest`
- `POST /checkout/member`
- `GET /invoice/{token}`
- `GET /invoice/lookup/{invoiceCode}`
- `POST /webhook/tripay`
- `POST /auth/register`
- `POST /auth/login`
- `GET /orders/member/{memberId}`
- `GET /wishlist/{userId}`
- `POST /wishlist`

## AI Service (Python)
- `POST /recommendations`
- `POST /fraud/score`
