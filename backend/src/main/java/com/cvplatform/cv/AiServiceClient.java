package com.cvplatform.cv;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@Component
@Slf4j
public class AiServiceClient {

    private final RestClient restClient;

    public AiServiceClient(RestClient.Builder builder,
                           @Value("${app.ai-service.base-url}") String baseUrl) {
        // IMPORTANT: use the injected builder bean so Spring Boot's auto-configured
        // Jackson HttpMessageConverters are wired in. RestClient.builder() (static)
        // returns a barebones builder without converters → request bodies are dropped.
        this.restClient = builder
                .baseUrl(baseUrl)
                .defaultHeader("Accept", MediaType.APPLICATION_JSON_VALUE)
                .build();
    }

    public ParseResponse parseCv(UUID userId, String fileObjectName) {
        Map<String, String> req = Map.of(
                "userId", userId.toString(),
                "fileObjectName", fileObjectName
        );
        log.info("Calling ai-service /v1/cv/parse for user {}, file {}", userId, fileObjectName);
        return restClient.post()
                .uri("/v1/cv/parse")
                .contentType(MediaType.APPLICATION_JSON)
                .body(req)
                .retrieve()
                .body(ParseResponse.class);
    }

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
