from fastapi import FastAPI
from pydantic import BaseModel
from recommendation import recommend_products
from fraud import fraud_score

app = FastAPI(title="Sebelas AI")

class RecommendationRequest(BaseModel):
    user_id: str | None = None
    recent_views: list[str] = []

class FraudRequest(BaseModel):
    invoice_id: str
    amount: float
    device_fingerprint: str
    attempts: int

@app.get("/health")
async def health():
    return {"status": "ok"}

@app.post("/recommendations")
async def recommendations(payload: RecommendationRequest):
    items = recommend_products(payload.user_id, payload.recent_views)
    return {"items": items}

@app.post("/fraud/score")
async def fraud(payload: FraudRequest):
    score = fraud_score(payload.invoice_id, payload.amount, payload.device_fingerprint, payload.attempts)
    return {"risk_score": score}
