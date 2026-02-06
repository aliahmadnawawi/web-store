# Security Summary

- JWT-based member authentication
- CSRF token for authenticated actions (cookie-based)
- CORS enabled for API access
- CSP + X-Frame-Options headers on web app
- Rate limiting on checkout/invoice endpoints
- Input validation and sanitization on server
- Idempotent webhook handling to prevent double delivery
