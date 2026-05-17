package com.cvplatform.subscription.iyzico;

import com.cvplatform.common.ApiException;
import com.cvplatform.user.SubscriptionType;
import com.cvplatform.user.User;
import com.iyzipay.Options;
import com.iyzipay.model.Address;
import com.iyzipay.model.BasketItem;
import com.iyzipay.model.BasketItemType;
import com.iyzipay.model.Buyer;
import com.iyzipay.model.CheckoutFormInitialize;
import com.iyzipay.model.CheckoutForm;
import com.iyzipay.model.Currency;
import com.iyzipay.model.Locale;
import com.iyzipay.model.PaymentGroup;
import com.iyzipay.model.Status;
import com.iyzipay.request.CreateCheckoutFormInitializeRequest;
import com.iyzipay.request.RetrieveCheckoutFormRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Collections;
import java.util.UUID;

/**
 * Thin wrapper around Iyzico's Checkout Form (sandbox-friendly).
 *
 * Flow:
 *   1. Frontend hits POST /v1/billing/iyzico/checkout { plan: "PREMIUM" }
 *   2. We call CheckoutFormInitialize.create() with the user's data + plan
 *      price and get back a `paymentPageUrl` + a `token` (the conversationId
 *      we generate is what we use to look up the payment later).
 *   3. Browser navigates to paymentPageUrl, user pays, Iyzico redirects to
 *      our callback URL with the same token.
 *   4. We retrieve the result (CheckoutForm.retrieve) — if status SUCCESS,
 *      flip the user's plan, audit, redirect to frontendSuccessUrl.
 *
 * Stubbed mode: when apiKey is blank we skip the Iyzico SDK entirely and
 * return a synthetic checkout URL pointing straight to our callback with a
 * fake "success" token. Lets the demo run without Iyzico credentials.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class IyzicoService {

    private final IyzicoProperties props;

    public record CheckoutResult(String paymentPageUrl, String token) {}

    public boolean isConfigured() {
        return props.getApiKey() != null && !props.getApiKey().isBlank()
                && props.getSecretKey() != null && !props.getSecretKey().isBlank();
    }

    public CheckoutResult initialize(User user, SubscriptionType plan) {
        BigDecimal price = priceFor(plan);
        String conversationId = "conv-" + UUID.randomUUID();

        // Stubbed mode for local dev without Iyzico credentials. Skips the
        // SDK and points the browser at our own callback with a fake
        // success token — exercise the rest of the wiring end-to-end.
        if (!isConfigured()) {
            log.warn("Iyzico API key not configured — using stub checkout (NO real payment)");
            String stubUrl = props.getCallbackUrl() + "?token=stub-" + plan.name()
                    + "&conversationId=" + conversationId + "&stub=true";
            return new CheckoutResult(stubUrl, conversationId);
        }

        CreateCheckoutFormInitializeRequest req = new CreateCheckoutFormInitializeRequest();
        req.setLocale(Locale.TR.getValue());
        req.setConversationId(conversationId);
        req.setPrice(price);
        req.setPaidPrice(price);
        req.setCurrency(Currency.TRY.name());
        req.setBasketId("plan-" + plan.name());
        req.setPaymentGroup(PaymentGroup.SUBSCRIPTION.name());
        req.setCallbackUrl(props.getCallbackUrl() + "?conversationId=" + conversationId);
        req.setEnabledInstallments(Collections.singletonList(1));

        Buyer buyer = new Buyer();
        buyer.setId(user.getId().toString());
        buyer.setName(safe(user.getFirstName(), "Aday"));
        buyer.setSurname(safe(user.getLastName(), "Kullanıcı"));
        buyer.setEmail(user.getEmail());
        buyer.setGsmNumber("+905555555555");
        buyer.setIdentityNumber("11111111111");   // sandbox dummy
        buyer.setRegistrationAddress(safe(user.getCity(), "İstanbul"));
        buyer.setIp("127.0.0.1");
        buyer.setCity(safe(user.getCity(), "İstanbul"));
        buyer.setCountry("Turkey");
        req.setBuyer(buyer);

        Address billing = new Address();
        billing.setContactName((buyer.getName() + " " + buyer.getSurname()).trim());
        billing.setCity(safe(user.getCity(), "İstanbul"));
        billing.setCountry("Turkey");
        billing.setAddress(safe(user.getCity(), "İstanbul"));
        req.setBillingAddress(billing);
        req.setShippingAddress(billing);

        BasketItem item = new BasketItem();
        item.setId("plan-" + plan.name());
        item.setName(plan.name() + " Plan — Aylık abonelik");
        item.setCategory1("Subscription");
        item.setItemType(BasketItemType.VIRTUAL.name());
        item.setPrice(price);
        req.setBasketItems(Collections.singletonList(item));

        CheckoutFormInitialize result = CheckoutFormInitialize.create(req, options());
        if (!Status.SUCCESS.getValue().equals(result.getStatus())) {
            log.error("Iyzico checkout init failed: errorCode={} message={}",
                    result.getErrorCode(), result.getErrorMessage());
            throw ApiException.badRequest("IYZICO_INIT_FAILED",
                    "Ödeme başlatılamadı: " + result.getErrorMessage());
        }
        return new CheckoutResult(result.getPaymentPageUrl(), result.getToken());
    }

    /**
     * Retrieve the result of a finished checkout. Returns true if the payment
     * succeeded so the caller can flip the plan; false otherwise.
     */
    public boolean wasSuccessful(String token, String conversationId) {
        if (!isConfigured()) {
            // In stub mode the callback is hit directly by initialize() — token
            // shape is "stub-<PLAN>"; trust it.
            return token != null && token.startsWith("stub-");
        }
        RetrieveCheckoutFormRequest req = new RetrieveCheckoutFormRequest();
        req.setLocale(Locale.TR.getValue());
        req.setConversationId(conversationId);
        req.setToken(token);

        CheckoutForm form = CheckoutForm.retrieve(req, options());
        boolean ok = Status.SUCCESS.getValue().equals(form.getStatus())
                && "SUCCESS".equals(form.getPaymentStatus());
        if (!ok) {
            log.warn("Iyzico payment NOT successful: status={} paymentStatus={} err={}",
                    form.getStatus(), form.getPaymentStatus(), form.getErrorMessage());
        }
        return ok;
    }

    public BigDecimal priceFor(SubscriptionType plan) {
        return switch (plan) {
            case PREMIUM -> BigDecimal.valueOf(props.getPremiumPrice())
                    .setScale(2, RoundingMode.HALF_UP);
            case ENTERPRISE -> BigDecimal.valueOf(props.getEnterprisePrice())
                    .setScale(2, RoundingMode.HALF_UP);
            default -> throw ApiException.badRequest("FREE_PLAN_NOT_PAYABLE",
                    "FREE plan için ödeme akışı yok");
        };
    }

    private Options options() {
        Options o = new Options();
        o.setApiKey(props.getApiKey());
        o.setSecretKey(props.getSecretKey());
        o.setBaseUrl(props.getBaseUrl());
        return o;
    }

    private static String safe(String s, String fallback) {
        return (s == null || s.isBlank()) ? fallback : s;
    }
}
