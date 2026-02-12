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
        return {"answer": "Tulis pertanyaanmu ya. Aku bisa bantu: cara bayar, QRIS, status invoice, kebijakan privasi, dan ketentuan layanan."}

    if "qris" in q:
        return {"answer": "Pilih metode QRIS saat checkout. Di halaman invoice akan muncul QR untuk discan via aplikasi e-wallet/banking yang mendukung QRIS."}
    if "cara bayar" in q or "bayar" in q:
        return {"answer": "Buka halaman invoice, lalu ikuti instruksi pembayaran (VA/QRIS). Setelah bayar, tekan Refresh Status sampai status berubah menjadi PAID."}
    if "invoice" in q or "status" in q or "lacak" in q:
        return {"answer": "Kalau kamu checkout sebagai guest, kamu bisa lacak invoice di beranda (fitur Lacak Pesanan). Kalau member, buka menu History."}
    if "privasi" in q or "kebijakan privasi" in q:
        return {"answer": "Kebijakan privasi tersedia di halaman Kebijakan Privasi. Di sana dijelaskan data yang dikumpulkan, penggunaan data, dan keamanan data."}
    if "ketentuan" in q or "syarat" in q:
        return {"answer": "Ketentuan layanan tersedia di halaman Ketentuan Layanan. Di sana dijelaskan aturan penggunaan, pembayaran, refund, dan batas tanggung jawab."}
    if "refund" in q or "batal" in q:
        return {"answer": "Untuk refund/pembatalan, hubungi CS via WhatsApp dan sertakan nomor invoice."}

    return {"answer": "Aku bisa bantu: cara bayar, QRIS, status invoice, kebijakan privasi, dan ketentuan layanan. Tulis pertanyaan lebih spesifik ya."}
