package com.cvplatform.audit;

/**
 * Stable identifiers for audit-logged events. Keep these short, snake-cased
 * and grouped by domain so admin filters stay tidy.
 */
public final class AuditEventType {
    private AuditEventType() {}

    // Auth
    public static final String LOGIN_SUCCESS         = "auth.login.success";
    public static final String LOGIN_FAILED          = "auth.login.failed";
    public static final String REGISTER              = "auth.register";

    // Jobs
    public static final String JOB_CREATED           = "job.created";
    public static final String JOB_UPDATED           = "job.updated";
    public static final String JOB_DELETED           = "job.deleted";

    // Applications
    public static final String APPLICATION_SUBMITTED = "application.submitted";
    public static final String APPLICATION_STATUS_CHANGED = "application.status.changed";

    // Interviews
    public static final String INTERVIEW_SCHEDULED   = "interview.scheduled";
    public static final String INTERVIEW_STARTED     = "interview.started";
    public static final String INTERVIEW_ENDED       = "interview.ended";

    // Billing
    public static final String BILLING_UPGRADED      = "billing.upgraded";

    // Admin actions
    public static final String ADMIN_USER_BANNED     = "admin.user.banned";
    public static final String ADMIN_USER_UNBANNED   = "admin.user.unbanned";
    public static final String ADMIN_PLAN_CHANGED    = "admin.user.plan_changed";
    public static final String ADMIN_COMPANY_VERIFIED = "admin.company.verified";
}
