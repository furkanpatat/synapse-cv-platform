package com.cvplatform.cv;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.client.RestClientCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.time.Duration;
import java.util.List;
import java.util.UUID;

@Component
@Slf4j
public class AiServiceClient {

    private final RestClient restClient;

    public AiServiceClient(@Value("${app.ai-service.base-url}") String baseUrl) {
        this.restClient = RestClient.builder()
                .baseUrl(baseUrl)
                .build();
    }

    public ParseResponse parseCv(UUID userId, String fileObjectName) {
        ParseRequest req = new ParseRequest(userId.toString(), fileObjectName);
        log.info("Calling ai-service /v1/cv/parse for user {}, file {}", userId, fileObjectName);
        return restClient.post()
                .uri("/v1/cv/parse")
                .body(req)
                .retrieve()
                .body(ParseResponse.class);
    }

    public record ParseRequest(String userId, String fileObjectName) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record ParseResponse(
            String rawText,
            Personal personal,
            String summary,
            List<String> skills,
            List<Education> education,
            List<Experience> experience,
            List<Project> projects,
            List<String> languages
    ) {
        @JsonIgnoreProperties(ignoreUnknown = true)
        public record Personal(String name, String email, String phone, String location) {}

        @JsonIgnoreProperties(ignoreUnknown = true)
        public record Education(String school, String degree, String field,
                                String startYear, String endYear) {}

        @JsonIgnoreProperties(ignoreUnknown = true)
        public record Experience(String company, String role, String startDate,
                                 String endDate, String description) {}

        @JsonIgnoreProperties(ignoreUnknown = true)
        public record Project(String name, String description, List<String> technologies) {}
    }
}
