package com.cvplatform.ai;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.time.Duration;
import java.util.Map;

@Component
@Slf4j
public class AiAssistantClient {

    private final RestClient restClient;

    public AiAssistantClient(RestClient.Builder builder,
                             @Value("${app.ai-service.base-url}") String baseUrl) {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(Duration.ofSeconds(10));
        factory.setReadTimeout(Duration.ofSeconds(120));

        this.restClient = builder
                .baseUrl(baseUrl)
                .requestFactory(factory)
                .defaultHeader("Accept", MediaType.APPLICATION_JSON_VALUE)
                .build();
    }

    public String generateText(String systemPrompt, String userPrompt, double temperature) {
        Map<String, Object> req = Map.of(
                "systemPrompt", systemPrompt,
                "userPrompt", userPrompt,
                "temperature", temperature,
                "maxOutputTokens", 900
        );
        log.debug("Calling ai-service /v1/assistant/text (temp={})", temperature);
        TextResponse body = restClient.post()
                .uri("/v1/assistant/text")
                .contentType(MediaType.APPLICATION_JSON)
                .body(req)
                .retrieve()
                .body(TextResponse.class);
        return body == null ? "" : body.text();
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record TextResponse(String text) {}
}
