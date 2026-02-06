import math


def fraud_score(invoice_id: str, amount: float, device_fingerprint: str, attempts: int) -> float:
    # Simple heuristic placeholder: higher attempts and very large amounts increase risk
    base = min(attempts / 5.0, 1.0)
    amount_factor = min(amount / 2000000.0, 1.0)
    entropy = (len(set(device_fingerprint)) / 20.0) if device_fingerprint else 0.2
    score = (0.5 * base) + (0.4 * amount_factor) + (0.1 * (1 - entropy))
    return round(min(1.0, score), 3)
