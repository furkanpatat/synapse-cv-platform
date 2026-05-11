# Faz 1 — Auth API Test Rehberi

Bütün endpoint'ler `http://localhost:8080/api` altında. Spring Security'de `/v1/auth/**` ve `/v1/ping` public, gerisi JWT ister.

> Önce **MailHog** UI'ı aç → http://localhost:8025 (doğrulama mailini buradan göreceksin)

---

## 1. USER Kaydı

```bash
curl -X POST http://localhost:8080/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "ali@example.com",
    "password": "GuvenliSifre123",
    "firstName": "Ali",
    "lastName": "Yılmaz",
    "role": "USER"
  }'
```

Cevap (200):
```json
{
  "accessToken": "eyJhbGciOi...",
  "refreshToken": "abc123...",
  "expiresInSeconds": 900,
  "user": {
    "id": "uuid",
    "email": "ali@example.com",
    "firstName": "Ali",
    "lastName": "Yılmaz",
    "role": "USER",
    "emailVerified": false
  }
}
```

> MailHog UI'da doğrulama maili göründü mü? http://localhost:8025

---

## 2. COMPANY Kaydı

```bash
curl -X POST http://localhost:8080/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "hr@acme.com",
    "password": "AcmeHR12345",
    "firstName": "Mehmet",
    "lastName": "Demir",
    "role": "COMPANY",
    "companyName": "Acme Yazılım A.Ş.",
    "taxNo": "1234567890",
    "sector": "Yazılım"
  }'
```

`companies` tablosunda `verified=false` olarak satır oluşur — admin onayı bekler (Faz 7'de).

---

## 3. Login

```bash
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "ali@example.com", "password": "GuvenliSifre123"}'
```

---

## 4. Korumalı Endpoint (`/me`)

```bash
ACCESS_TOKEN="eyJhbGciOi..."   # login cevabından kopyala

curl http://localhost:8080/api/v1/auth/me \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

---

## 5. Token Yenileme

```bash
curl -X POST http://localhost:8080/api/v1/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken": "abc123..."}'
```

> Refresh token kullanıldıktan sonra revoke edilir, yenisi döner (rotation).

---

## 6. Logout

```bash
curl -X POST http://localhost:8080/api/v1/auth/logout \
  -H "Content-Type: application/json" \
  -d '{"refreshToken": "abc123..."}'
```

---

## 7. E-posta Doğrulama

MailHog'daki linke tıkla, ya da token'ı manuel kullan:

```bash
curl "http://localhost:8080/api/v1/auth/verify-email?token=TOKEN_BURAYA"
```

---

## 8. Hata Senaryoları

| Senaryo | HTTP | Code |
|---------|------|------|
| Email zaten kayıtlı | 409 | `EMAIL_TAKEN` |
| Yanlış şifre | 401 | `INVALID_CREDENTIALS` |
| Validation hatası | 400 | `VALIDATION_FAILED` |
| Geçersiz JWT | 401 | (filter cevap döner) |
| Yetkisiz endpoint | 403 | `FORBIDDEN` |
| ADMIN register denemesi | 403 | `ADMIN_REGISTRATION_FORBIDDEN` |
| COMPANY register'da companyName eksik | 400 | `COMPANY_NAME_REQUIRED` |

---

## 9. DB Kontrol

```bash
docker exec cvp-postgres psql -U cvp -d cvplatform -c \
  "SELECT id, email, role, email_verified, banned FROM users;"

docker exec cvp-postgres psql -U cvp -d cvplatform -c \
  "SELECT c.name, c.verified, u.email FROM companies c JOIN users u ON c.owner_user_id = u.id;"
```

---

## 10. Swagger UI

http://localhost:8080/api/swagger-ui.html — bütün endpoint'leri buradan da deneyebilirsin.
