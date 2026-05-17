package com.cvplatform.subscription.iyzico;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@ConfigurationProperties(prefix = "app.iyzico")
@Data
public class IyzicoProperties {
    /** Iyzico sandbox or production API key. Blank = stubbed mode (dev/demo). */
    private String apiKey = "";
    private String secretKey = "";
    /** https://sandbox-api.iyzipay.com  (or  https://api.iyzipay.com  in prod). */
    private String baseUrl = "https://sandbox-api.iyzipay.com";

    /** Where the user is sent after the Iyzico checkout form closes. */
    private String callbackUrl = "http://localhost:8080/api/v1/billing/iyzico/callback";

    /** Where the frontend deep-links to once the callback is processed. */
    private String frontendSuccessUrl = "http://localhost:3000/dashboard/billing?upgraded=1";
    private String frontendFailureUrl = "http://localhost:3000/dashboard/billing?payment=failed";

    /** Plan prices (TRY). Production-grade systems would model this in DB; */
    /** for the demo a hard-coded map is plenty. */
    private double premiumPrice = 99.00;
    private double enterprisePrice = 499.00;
}
