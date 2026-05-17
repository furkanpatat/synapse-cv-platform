# Kubernetes deployment

Production-style manifests for Synapse. The files are numbered so a
plain `kubectl apply -f infra/k8s/` applies them in dependency order.

## What's in here

| File | What it deploys |
|---|---|
| `00-namespace.yaml`         | `cv-platform` namespace |
| `01-config.yaml`            | ConfigMaps (non-secret env: URLs, ports, plan prices) |
| `02-secrets.example.yaml`   | **Example** Secret manifest — copy to `02-secrets.yaml`, fill real values, keep out of git |
| `10-postgres.yaml`          | StatefulSet (1 replica, 10 Gi PVC) + headless Service |
| `11-mongo.yaml`             | StatefulSet (1 replica, 10 Gi PVC) + headless Service |
| `12-redis-rabbit-minio.yaml`| Redis + RabbitMQ + MinIO Deployments / Services / MinIO PVC |
| `20-backend.yaml`           | Spring Boot Deployment (2 replicas) + Service + HorizontalPodAutoscaler (2–8 pods @ 60 % CPU) |
| `21-ai-service.yaml`        | FastAPI Deployment (1 replica, ~1.5 Gi memory for sentence-transformers) + Service |
| `22-frontend.yaml`          | Next.js Deployment (2 replicas) + Service |
| `30-ingress.yaml`           | Nginx Ingress for frontend + backend with cert-manager TLS |

## Apply

```bash
# 1. Fill real secrets first (don't commit)
cp infra/k8s/02-secrets.example.yaml infra/k8s/02-secrets.yaml
$EDITOR infra/k8s/02-secrets.yaml

# 2. Apply everything in order
kubectl apply -f infra/k8s/

# 3. Watch
kubectl -n cv-platform get pods -w
```

## What this is *not*

- **A production deploy.** Single-replica Postgres / Mongo is fine for
  staging but should be swapped for a managed cluster (RDS, Cloud SQL,
  Crunchy Operator, MongoDB Atlas) before any real traffic.
- **A Helm chart.** For a real production setup you'd parameterise these
  with Helm or Kustomize so prod / staging / dev share templates.
- **Sealed.** Secrets are plain YAML. Add
  [SealedSecrets](https://github.com/bitnami-labs/sealed-secrets) or
  ExternalSecrets before committing real credentials.

## Image build

The manifests reference `ghcr.io/your-org/cvp-{backend,ai-service,frontend}:latest`.
Replace with your registry. Suggested build paths:

```bash
# Backend — uses jib so no Dockerfile needed
mvn -f backend/pom.xml jib:build -Dimage=ghcr.io/your-org/cvp-backend:latest

# ai-service
docker build -t ghcr.io/your-org/cvp-ai-service:latest ai-service/
docker push ghcr.io/your-org/cvp-ai-service:latest

# Frontend (Next.js standalone output)
docker build -t ghcr.io/your-org/cvp-frontend:latest frontend/
docker push ghcr.io/your-org/cvp-frontend:latest
```
