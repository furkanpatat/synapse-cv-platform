# syntax=docker/dockerfile:1.7

# sentence-transformers + torch are bulky — using the bullseye slim
# variant (not alpine) so we get pre-built wheels and avoid a 20-minute
# native compile. Python 3.11 matches the dev conda env exactly.
FROM python:3.11-slim-bullseye AS runtime

ENV PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    PYTHONDONTWRITEBYTECODE=1

# build-essential is only needed if a transitive C extension lacks a
# wheel; we ship it so a future requirements bump doesn't surprise us.
RUN apt-get update \
 && apt-get install -y --no-install-recommends build-essential curl \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# requirements first for layer cache reuse
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Pre-download the sentence-transformer model into the image so the
# first /v1/embeddings/* call doesn't 30-second-cold-start in prod.
# (Comment out if you'd rather keep the image small and warm on first call.)
RUN python -c "from sentence_transformers import SentenceTransformer; \
    SentenceTransformer('sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2')"

COPY app ./app

# Non-root
RUN useradd --create-home --shell /bin/bash app && chown -R app:app /app
USER app

HEALTHCHECK --interval=15s --timeout=3s --start-period=30s --retries=3 \
    CMD curl -fsS http://localhost:8000/ping || exit 1

EXPOSE 8000

# uvicorn workers=1 because the embedding model is loaded into RAM
# per process — multiply this in K8s with replicas, not workers.
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "1"]
