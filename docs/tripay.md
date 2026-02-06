# Tripay Integration Notes

- Create transaction signature: HMAC SHA256 of `merchant_code + merchant_ref + amount` using `TRIPAY_PRIVATE_KEY`.
- Webhook signature: HMAC SHA256 of raw JSON body using `TRIPAY_PRIVATE_KEY`.
- Webhook headers: `X-Callback-Event: payment_status`, `X-Callback-Signature`.
