// k6 load test — exercises the hottest endpoints under realistic mix.
//
// Run:   k6 run -e BASE=https://staging.synapse.example.com infra/loadtest/cv-upload.js
//
// Scenario:
//   - 50 VUs ramping over 1 min, sustained 4 min, ramp down 1 min
//   - 70% browse jobs (cheap GET), 20% post a CV analysis, 10% login
//   - p95 latency budget: 1.5 s, error budget: 1%
//
// What this exposes:
//   * HikariCP / PgBouncer saturation (jumps in p95 are a smoking gun)
//   * RateLimitService trips (429s appear in `http_req_failed`)
//   * Gemini quota exhaustion (5xx from /analysis)
//
// Don't point this at production. Staging only. Better: run from a
// throwaway VM in the same region as the cluster so you measure the
// app, not your home DSL.

import http from "k6/http";
import { check, sleep } from "k6";
import { Rate } from "k6/metrics";

const BASE = __ENV.BASE || "http://localhost:8080";
const errorRate = new Rate("errors");

export const options = {
  scenarios: {
    mixed: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: "1m", target: 50 },
        { duration: "4m", target: 50 },
        { duration: "1m", target: 0 },
      ],
      gracefulRampDown: "30s",
    },
  },
  thresholds: {
    http_req_duration: ["p(95)<1500", "p(99)<3000"],
    http_req_failed: ["rate<0.01"],
    errors: ["rate<0.02"],
  },
};

// Demo seed user — see infra/seed_demo.sql.
const DEMO_USER = { email: "demo@synapse.example", password: "Demo1234!" };

function login() {
  const r = http.post(
    `${BASE}/api/v1/auth/login`,
    JSON.stringify(DEMO_USER),
    { headers: { "Content-Type": "application/json" }, tags: { name: "login" } }
  );
  check(r, { "login 200": (res) => res.status === 200 }) || errorRate.add(1);
  return r.json("accessToken");
}

export default function () {
  // 70% — anonymous job browsing (cache + DB path, no LLM)
  const browseRoll = Math.random();
  if (browseRoll < 0.7) {
    const r = http.get(`${BASE}/api/v1/jobs?page=0&size=20`, {
      tags: { name: "jobs-list" },
    });
    check(r, { "jobs 200": (res) => res.status === 200 }) || errorRate.add(1);
    sleep(1 + Math.random());
    return;
  }

  // 10% — login flow on its own
  if (browseRoll < 0.8) {
    login();
    sleep(2);
    return;
  }

  // 20% — authenticated CV re-analysis (exercises Gemini + DB + audit)
  const token = login();
  if (!token) return;
  const r = http.post(
    `${BASE}/api/v1/cv/analyse`,
    null,
    {
      headers: { Authorization: `Bearer ${token}` },
      tags: { name: "cv-analyse" },
    }
  );
  // 429 (rate-limited) is expected sometimes — it's a feature, not a
  // failure. Don't count it toward the error budget.
  if (r.status !== 429) {
    check(r, { "analyse <500": (res) => res.status < 500 }) || errorRate.add(1);
  }
  sleep(3 + Math.random() * 2);
}
