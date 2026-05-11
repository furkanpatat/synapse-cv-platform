# Faz 3 — CV Upload & AI Parse Test Rehberi

## Gerekli Servisler

| Servis | Komut | Kontrol |
|--------|-------|---------|
| Docker stack | `docker compose -f infra/docker-compose.yml up -d` | 6 container Up |
| Backend | `cd backend && ./mvnw spring-boot:run` | http://localhost:8080/api/v1/ping |
| AI Service | `cd ai-service && source .venv/bin/activate && uvicorn app.main:app --reload --port 8000` | http://localhost:8000/ping |
| Frontend | `cd frontend && npm run dev` | http://localhost:3000 |

## İlk Kurulum (Bir Defalık)

### AI Service Bağımlılıkları
```bash
cd /Users/furkanpatat/Desktop/cv-platform/ai-service
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

### Gemini API Key
`infra/.env` dosyandaki `GEMINI_API_KEY` boş ise, ai-service yine çalışır ama parse boş döner.
Key'i ai-service'in göreceği yere de koy:
```bash
cd /Users/furkanpatat/Desktop/cv-platform/ai-service
echo "GEMINI_API_KEY=your-key-here" > .env
```

## Akış

1. **Tarayıcıda giriş yap** (USER rolü) → http://localhost:3000/login
2. **CV sekmesine git** → /dashboard/cv
3. **"CV Yükle"** butonu → bir PDF veya DOCX seç
4. Beklenen:
   - Backend MinIO'ya kaydeder
   - ai-service'e POST /v1/cv/parse atar
   - ai-service dosyayı MinIO'dan indirir → pdfplumber/python-docx ile metni çıkarır
   - Gemini metni yapılandırılmış JSON'a çevirir
   - Backend MongoDB'ye yazar
   - Frontend parse sonucunu (kişisel, yetenekler, deneyim, eğitim, projeler, diller) gösterir

## Manuel Test (curl)

```bash
# 1. Login (önceki örnekten access token al)
TOKEN="eyJhbGciOi..."

# 2. CV upload
curl -X POST http://localhost:8080/api/v1/cv/upload \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@/path/to/cv.pdf"

# 3. CV oku
curl http://localhost:8080/api/v1/cv/me \
  -H "Authorization: Bearer $TOKEN"
```

## Beklenen Hatalar

| Senaryo | HTTP | Code |
|---------|------|------|
| Dosya boş | 400 | `FILE_EMPTY` |
| 10MB üzeri | 400 | `FILE_TOO_LARGE` |
| PDF/DOCX dışı | 400 | `INVALID_FILE_TYPE` |
| Henüz CV yok | 404 | `CV_NOT_FOUND` |
| ai-service down | 500 | `INTERNAL_ERROR` (CV row PENDING/FAILED kalır) |

## Sorun Giderme

- **MongoDB auth hatası**: `docker compose restart mongo` (auth ilk başta init lazım)
- **MinIO bucket yok**: backend ilk başlatmada `cv-files` bucket'ını otomatik açar
- **Gemini quota**: ücretsiz Gemini Flash günde 1500 istek, normalde yeterli
- **Parse boş döndü**: ai-service log'una bak — `GEMINI_API_KEY not set` mi diyor?
- **MinIO endpoint farklı**: ai-service `localhost:9000`'a bağlanır; backend Docker içinden çalışırsa `minio:9000` olmalı

## DB Kontrol

```bash
# Postgres - kullanıcılar
docker exec cvp-postgres psql -U cvp -d cvplatform -c "SELECT email, role FROM users;"

# MongoDB - CV'ler
docker exec cvp-mongo mongosh --quiet -u cvp -p cvp_dev_pass --authenticationDatabase admin \
  --eval 'db.getSiblingDB("cvplatform").cv_documents.find({}, {originalFilename:1, status:1, "personal.name":1}).pretty()'

# MinIO bucket
docker exec cvp-minio mc alias set local http://localhost:9000 cvp cvp_dev_pass
docker exec cvp-minio mc ls local/cv-files
```
