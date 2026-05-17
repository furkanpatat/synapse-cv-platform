// Sentry — edge runtime (middleware, edge functions).
import * as Sentry from "@sentry/nextjs";

const dsn = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.SENTRY_ENVIRONMENT ?? "dev",
    release: process.env.SENTRY_RELEASE ?? "0.2.0",
    tracesSampleRate: 0.1,
  });
}
