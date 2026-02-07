import os
import random
from typing import Any

import httpx


def _catalog_base() -> str:
    return os.getenv("CATALOG_API", "").rstrip("/")


def _fetch_products(limit: int = 80) -> list[dict[str, Any]]:
    base = _catalog_base()
    if not base:
        return []

    url = f"{base}/products?limit={limit}"
    try:
        r = httpx.get(url, timeout=4.0)
        data = r.json() if r.status_code == 200 else {}
        items = data.get("data", [])
        return items if isinstance(items, list) else []
    except Exception:
        return []


def recommend_products(user_id: str | None, recent_views: list[str], limit: int = 10) -> list[dict[str, Any]]:
    """
    Simple, deterministic-ish recommender:
    - pulls products from Catalog API
    - excludes recent_views (by id or slug)
    - returns a shuffled slice, seeded by user_id for stability
    """
    products = _fetch_products()
    if not products:
        return []

    recent = set(str(x) for x in (recent_views or []))
    pool = [
        p
        for p in products
        if str(p.get("id", "")) not in recent and str(p.get("slug", "")) not in recent
    ] or products

    seed = str(user_id or "")
    rnd = random.Random(seed)
    rnd.shuffle(pool)
    return pool[: max(1, min(int(limit), len(pool)))]
