# Sebelas Indonesia Flows

## Guest Checkout

1. User selects product and taps `Beli`
2. Minimal input: WhatsApp or email
3. System creates invoice + unique invoice URL
4. Tripay payment created with unique amount code
5. Tripay webhook confirms payment (signature-verified)
6. Auto-delivery: fetch one unused stock row, mark sold, link to invoice
7. Send delivery via WhatsApp/Email, also show on invoice page

## Member Checkout

1. Member chooses product
2. Invoice created and tied to member
3. Payment via Tripay
4. After `PAID`, data appears in invoice + order history
5. Wishlist remains available for future buys

## Auto-Delivery Rules

- Account/password: deliver credentials automatically
- File: deliver secured download link (time-limited)
- Service: flag as manual, notify admin

## Security

- JWT for authenticated endpoints
- Rate limiting for invoice checks and checkout
- CSP + X-Frame-Options headers
- Input validation + sanitization in all forms
- Idempotent webhook handling
