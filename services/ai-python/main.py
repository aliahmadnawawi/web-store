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

class AssistantRequest(BaseModel):
    message: str

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

@app.post("/assistant")
async def assistant(payload: AssistantRequest):
    q = (payload.message or "").strip().lower()
    if not q:
        return {"answer": "Tulis pertanyaanmu ya. Aku bisa bantu: cara bayar, QRIS, PPOB, status invoice."}

    if "qris" in q:
        return {"answer": "Pilih metode QRIS saat checkout. Di halaman invoice akan muncul QR untuk discan via aplikasi e-wallet/banking yang mendukung QRIS."}
    if "cara bayar" in q or "bayar" in q:
        return {"answer": "Buka halaman invoice, lalu ikuti instruksi pembayaran (VA/QRIS). Setelah bayar, tekan Refresh Status sampai status berubah menjadi PAID."}
    if "ppob" in q or "pulsa" in q or "paket data" in q or "data" in q or "pln" in q or "token" in q or "game" in q:
        return {"answer": "Masuk menu PPOB, pilih kategori (Pulsa/Data/PLN/Game/Voucher), isi nomor/ID pelanggan dulu, lalu pilih nominal dan checkout."}
    if "invoice" in q or "status" in q or "lacak" in q:
        return {"answer": "Kalau kamu checkout sebagai guest, kamu bisa lacak invoice di beranda (fitur Lacak Pesanan). Kalau member, buka menu History."}
    if "refund" in q or "batal" in q:
        return {"answer": "Untuk refund/pembatalan, hubungi CS via WhatsApp dan sertakan nomor invoice."}

    return {"answer": "Aku bisa bantu: cara bayar, QRIS, PPOB, status invoice, dan alur pembelian. Tulis pertanyaan lebih spesifik ya."}
