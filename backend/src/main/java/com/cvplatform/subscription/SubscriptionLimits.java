package com.cvplatform.subscription;

import com.cvplatform.user.SubscriptionType;

/**
 * Per-plan quotas. Tweak here only.
 */
public final class SubscriptionLimits {

    private SubscriptionLimits() {}

    // USER side
    public static final int FREE_AI_ANALYSES_PER_MONTH = 1;
    public static final int FREE_ACTIVE_APPLICATIONS = 5;

    // COMPANY side (note: companies live under USER table with role=COMPANY;
    // their subscriptionType acts as the company plan)
    public static final int FREE_COMPANY_ACTIVE_JOBS = 3;

    public static boolean isPremium(SubscriptionType type) {
        return type == SubscriptionType.PREMIUM || type == SubscriptionType.ENTERPRISE;
    }
}
