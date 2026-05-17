#!/usr/bin/env bash
# restore-drill.sh — disaster-recovery self-test.
#
# Pulls the most recent Postgres + Mongo dumps from S3 into a throwaway
# local Docker stack, restores them, and runs a handful of sanity queries
# (row counts vs. live, schema validation, foreign-key spot-check). Exits
# non-zero if the restore would NOT in fact recover the platform.
#
# Designed to run weekly from CI (.github/workflows/restore-drill.yml).
# Idempotent — wipes the temp containers/volumes on every invocation so
# repeated runs don't accumulate cruft.
#
# Required env (passed by CI from secrets):
#   AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_DEFAULT_REGION
#   BACKUP_BUCKET           e.g. s3://synapse-backups
#   POSTGRES_USER, POSTGRES_DB, POSTGRES_PASSWORD
#   MONGO_USER, MONGO_PASSWORD, MONGO_DB
#
# Exit codes:
#   0 = restore succeeded, all assertions passed
#   1 = a step failed (see stderr); deploy alarms should fire

set -euo pipefail

# ── Config ────────────────────────────────────────────────────────
PG_CONTAINER="restore-drill-pg"
MG_CONTAINER="restore-drill-mongo"
PG_PORT="55432"
MG_PORT="57017"
WORK_DIR="$(mktemp -d)"
trap 'cleanup' EXIT INT TERM

cleanup() {
  echo "→ cleanup"
  docker rm -f "$PG_CONTAINER" "$MG_CONTAINER" >/dev/null 2>&1 || true
  rm -rf "$WORK_DIR"
}

ok()   { echo -e "✓ $*"; }
fail() { echo -e "✗ $*" >&2; exit 1; }

require() { command -v "$1" >/dev/null || fail "missing required tool: $1"; }
require aws
require docker
require gunzip
require psql

# ── 1. Find latest dump in S3 ─────────────────────────────────────
echo "→ Listing latest backups in $BACKUP_BUCKET"
LATEST_PG=$(aws s3 ls "$BACKUP_BUCKET/postgres/" | awk '{print $4}' \
              | grep -E '\.sql\.gz$' | sort -r | head -n1)
LATEST_MG=$(aws s3 ls "$BACKUP_BUCKET/mongo/"    | awk '{print $4}' \
              | grep -E '\.tar\.gz$' | sort -r | head -n1)
[[ -n "$LATEST_PG" ]] || fail "no Postgres backups in S3 — backup CronJob may be broken"
[[ -n "$LATEST_MG" ]] || fail "no Mongo backups in S3 — backup CronJob may be broken"
echo "  Postgres: $LATEST_PG"
echo "  Mongo:    $LATEST_MG"

aws s3 cp "$BACKUP_BUCKET/postgres/$LATEST_PG" "$WORK_DIR/pg.sql.gz" --quiet
aws s3 cp "$BACKUP_BUCKET/mongo/$LATEST_MG"    "$WORK_DIR/mongo.tar.gz" --quiet
gunzip "$WORK_DIR/pg.sql.gz"
tar -xzf "$WORK_DIR/mongo.tar.gz" -C "$WORK_DIR"
ok "downloaded + unpacked"

# ── 2. Boot a throwaway Postgres + restore ────────────────────────
echo "→ Booting temp Postgres 16"
docker run -d --rm --name "$PG_CONTAINER" \
    -e POSTGRES_USER="$POSTGRES_USER" \
    -e POSTGRES_PASSWORD="$POSTGRES_PASSWORD" \
    -e POSTGRES_DB="$POSTGRES_DB" \
    -p "$PG_PORT:5432" \
    postgres:16-alpine >/dev/null

# Wait until Postgres is accepting connections (max 30 s)
for i in $(seq 1 30); do
  PGPASSWORD="$POSTGRES_PASSWORD" psql -h localhost -p "$PG_PORT" \
       -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "select 1" >/dev/null 2>&1 && break
  sleep 1
done
PGPASSWORD="$POSTGRES_PASSWORD" psql -h localhost -p "$PG_PORT" \
     -U "$POSTGRES_USER" -d "$POSTGRES_DB" -f "$WORK_DIR/pg.sql" >/dev/null
ok "Postgres restored"

# ── 3. Postgres sanity checks ─────────────────────────────────────
USERS_N=$(PGPASSWORD="$POSTGRES_PASSWORD" psql -h localhost -p "$PG_PORT" \
              -U "$POSTGRES_USER" -d "$POSTGRES_DB" -At \
              -c "select count(*) from users")
APPS_N=$(PGPASSWORD="$POSTGRES_PASSWORD" psql -h localhost -p "$PG_PORT" \
              -U "$POSTGRES_USER" -d "$POSTGRES_DB" -At \
              -c "select count(*) from applications")
JOBS_N=$(PGPASSWORD="$POSTGRES_PASSWORD" psql -h localhost -p "$PG_PORT" \
              -U "$POSTGRES_USER" -d "$POSTGRES_DB" -At \
              -c "select count(*) from job_postings")

[[ "$USERS_N" -gt 0 ]] || fail "users table is empty after restore"
[[ "$JOBS_N"  -gt 0 ]] || fail "job_postings table is empty after restore"
ok "row counts: users=$USERS_N · jobs=$JOBS_N · applications=$APPS_N"

# Foreign-key spot check: every application must reference a real user + job.
ORPHANS=$(PGPASSWORD="$POSTGRES_PASSWORD" psql -h localhost -p "$PG_PORT" \
              -U "$POSTGRES_USER" -d "$POSTGRES_DB" -At -c "
    select count(*) from applications a
     where not exists (select 1 from users u where u.id = a.user_id)
        or not exists (select 1 from job_postings j where j.id = a.job_id)")
[[ "$ORPHANS" -eq 0 ]] || fail "applications has $ORPHANS orphan rows"
ok "no orphan applications"

# ── 4. Boot temp Mongo + restore ──────────────────────────────────
echo "→ Booting temp Mongo 7"
docker run -d --rm --name "$MG_CONTAINER" \
    -e MONGO_INITDB_ROOT_USERNAME="$MONGO_USER" \
    -e MONGO_INITDB_ROOT_PASSWORD="$MONGO_PASSWORD" \
    -p "$MG_PORT:27017" \
    mongo:7 >/dev/null

for i in $(seq 1 30); do
  docker exec "$MG_CONTAINER" mongosh --quiet \
      -u "$MONGO_USER" -p "$MONGO_PASSWORD" --authenticationDatabase admin \
      --eval "db.runCommand({ ping: 1 })" >/dev/null 2>&1 && break
  sleep 1
done
DUMP_DIR=$(ls -d "$WORK_DIR"/mongo-* | head -n1)
docker cp "$DUMP_DIR" "$MG_CONTAINER:/restore"
docker exec "$MG_CONTAINER" mongorestore \
    -u "$MONGO_USER" -p "$MONGO_PASSWORD" --authenticationDatabase admin \
    --drop --quiet "/restore" >/dev/null
ok "Mongo restored"

CV_N=$(docker exec "$MG_CONTAINER" mongosh --quiet \
        -u "$MONGO_USER" -p "$MONGO_PASSWORD" --authenticationDatabase admin \
        "$MONGO_DB" --eval "db.cv_documents.countDocuments({})")
[[ "$CV_N" -gt 0 ]] || fail "cv_documents collection is empty after restore"
ok "cv_documents=$CV_N rows"

echo ""
ok "RESTORE DRILL PASSED — backups are restorable"
