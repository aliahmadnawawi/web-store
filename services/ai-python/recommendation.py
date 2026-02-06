from random import sample

CATALOG = [
    {"id": "netflix-1", "name": "Netflix 1 Bulan"},
    {"id": "spotify-1", "name": "Spotify Family"},
    {"id": "canva-1", "name": "Canva Pro"},
    {"id": "mlbb-86", "name": "MLBB 86 Diamonds"},
    {"id": "pulsa-50", "name": "Pulsa 50K"},
]


def recommend_products(user_id: str | None, recent_views: list[str]):
    # Placeholder logic: boost recently viewed categories
    pool = [item for item in CATALOG if item["id"] not in recent_views] or CATALOG
    return sample(pool, k=min(4, len(pool)))
