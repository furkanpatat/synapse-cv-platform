"use client";

// Company activity view re-uses the same data + UI as the user one.
// The /v1/audit/me endpoint scopes by the authenticated principal regardless
// of role, so company actions (job CRUD, interview scheduling, application
// status changes) show up here too.
export { default } from "@/app/(user)/dashboard/activity/page";
