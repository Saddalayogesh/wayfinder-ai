package com.tripplanner.ai;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.tripplanner.exception.ItineraryGenerationException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;

import java.time.Duration;

/**
 * Thin HTTP client for the Google Gemini Generative Language API.
 *
 * <p>The API key is read from the {@code GEMINI_API_KEY} environment variable
 * (via {@code gemini.api-key}) and is never hardcoded. When the key is
 * missing, calls fail fast with a friendly {@link ItineraryGenerationException}
 * instead of a cryptic HTTP error.</p>
 *
 * <p>Handles the response envelope: refusals ({@code promptFeedback.blockReason}),
 * abnormal {@code finishReason}s, and empty candidates all raise controlled
 * exceptions. The model's text payload is returned as a raw string for the
 * {@link GeminiService} to parse defensively.</p>
 */
@Service
public class GeminiClient {

    private final RestClient restClient;
    private final ObjectMapper objectMapper;
    private final String apiKey;
    private final String model;

    public GeminiClient(@Value("${gemini.api-key:}") String apiKey,
                        @Value("${gemini.model:gemini-flash-latest}") String model,
                        @Value("${gemini.base-url:https://generativelanguage.googleapis.com}") String baseUrl,
                        @Value("${gemini.timeout-ms:60000}") long timeoutMs,
                        ObjectMapper objectMapper) {
        this.apiKey = apiKey == null ? "" : apiKey.trim();
        this.model = model;
        this.objectMapper = objectMapper;

        SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
        requestFactory.setConnectTimeout((int) Math.max(1, timeoutMs));
        requestFactory.setReadTimeout((int) Math.max(1, timeoutMs));

        this.restClient = RestClient.builder()
                .baseUrl(baseUrl)
                .requestFactory(requestFactory)
                .build();
    }

    /**
     * Sends a prompt and returns the model's raw text output.
     *
     * @throws ItineraryGenerationException on missing key, API/network errors,
     *         refusal, or an unexpected response envelope.
     */
    public String generateText(String prompt) {
        if (apiKey.isBlank()) {
            throw new ItineraryGenerationException(
                    "Gemini API key is not configured. Set the GEMINI_API_KEY environment variable.");
        }

        var requestBody = java.util.Map.of(
                "contents", java.util.List.of(java.util.Map.of(
                        "role", "user",
                        "parts", java.util.List.of(java.util.Map.of("text", prompt)))),
                "generationConfig", java.util.Map.of(
                        "temperature", 0.7,
                        "maxOutputTokens", 4096,
                        "responseMimeType", "application/json"));

        String responseBody;
        try {
            responseBody = restClient.post()
                    .uri("/v1beta/models/{model}:generateContent", model)
                    .header("x-goog-api-key", apiKey)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(requestBody)
                    .retrieve()
                    .body(String.class);
        } catch (RestClientResponseException e) {
            throw new ItineraryGenerationException(
                    "Gemini API returned an error (HTTP " + e.getStatusCode().value() + ")");
        } catch (ResourceAccessException e) {
            throw new ItineraryGenerationException(
                    "Could not reach the Gemini API or the request timed out.");
        }

        return extractModelText(responseBody);
    }

    private String extractModelText(String responseBody) {
        if (responseBody == null || responseBody.isBlank()) {
            throw new ItineraryGenerationException("Gemini returned an empty response.");
        }

        JsonNode root;
        try {
            root = objectMapper.readTree(responseBody);
        } catch (Exception e) {
            throw new ItineraryGenerationException("Gemini returned an unreadable response.");
        }

        JsonNode blockReason = root.path("promptFeedback").path("blockReason");
        if (!blockReason.isMissingNode() && !blockReason.isNull() && !blockReason.asText().isBlank()) {
            throw new ItineraryGenerationException("Gemini blocked the request: " + blockReason.asText());
        }

        JsonNode candidates = root.get("candidates");
        if (candidates == null || !candidates.isArray() || candidates.isEmpty()) {
            throw new ItineraryGenerationException("Gemini returned no content.");
        }

        JsonNode first = candidates.get(0);
        String finishReason = first.path("finishReason").asText("");
        if (!finishReason.isBlank() && !"STOP".equals(finishReason)) {
            throw new ItineraryGenerationException("Gemini stopped generation: " + finishReason);
        }

        JsonNode parts = first.path("content").path("parts");
        if (!parts.isArray() || parts.isEmpty()) {
            throw new ItineraryGenerationException("Gemini returned no text parts.");
        }
        String text = parts.get(0).path("text").asText(null);
        if (text == null || text.isBlank()) {
            throw new ItineraryGenerationException("Gemini returned an empty response.");
        }
        return text;
    }
}
