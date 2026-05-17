// Sentry — browser SDK. Boots only when NEXT_PUBLIC_SENTRY_DSN is set;
// silent no-op otherwise so dev / preview deploys don't ping Sentry.
//
// Sampling kept conservative (10% traces, 10% session replay on error)
// to stay inside the free quota until we have a real budget.

import * as Sentry from "@sentry/nextjs";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.NEXT_PUBLIC_SENTRY_ENV ?? "dev",
    release: process.env.NEXT_PUBLIC_SENTRY_RELEASE ?? "0.2.0",
    tracesSampleRate: 0.1,
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 0.1,
    // Don't ship the user's free-text answers / CV content if we can avoid it.
    sendDefaultPii: false,
  });
}
