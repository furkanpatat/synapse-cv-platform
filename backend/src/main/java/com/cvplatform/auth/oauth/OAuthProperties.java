package com.cvplatform.auth.oauth;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@ConfigurationProperties(prefix = "app.oauth")
@Data
public class OAuthProperties {

    private Provider google = new Provider();
    private Provider github = new Provider();
    /** Where the frontend lives so we can craft the final redirect URL. */
    private String frontendRedirect = "http://localhost:3000/oauth/finish";

    @Data
    public static class Provider {
        private String clientId = "";
        private String clientSecret = "";
        /**
         * Full URL the provider should redirect back to (must match the value
         * registered in the provider console). Defaults to the backend's
         * own callback path.
         */
        private String redirectUri = "";
    }
}
