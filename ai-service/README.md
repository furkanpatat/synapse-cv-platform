# AI Service

FastAPI tabanlı mikroservis — CV parsing, GitHub analizi ve Gemini LLM ile yetkinlik doğrulama.

## Geliştirme

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Sağlık kontrolü: http://localhost:8000/ping
