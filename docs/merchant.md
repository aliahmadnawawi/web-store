# Google Merchant Center Sync

Option A: Scheduled Fetch
- Host the generated XML at `/feed.xml` (Catalog service provides `/feed.xml`)
- Point GMC Scheduled Fetch to that URL

Option B: Content API
- Use service account credentials
- Push updates whenever a product is created or updated

Required fields for digital goods:
- `id`, `title`, `description`, `link`, `image_link`, `price`, `availability`
- `identifier_exists` = false (no GTIN)
