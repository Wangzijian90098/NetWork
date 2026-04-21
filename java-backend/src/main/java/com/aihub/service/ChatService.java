package com.aihub.service;

import com.aihub.entity.ApiKey;
import com.aihub.entity.ModelPrice;
import com.aihub.entity.PlatformKey;
import com.aihub.entity.User;
import com.aihub.entity.UsageLog;
import com.aihub.repository.ApiKeyRepository;
import com.aihub.repository.ModelPriceRepository;
import com.aihub.repository.PlatformKeyRepository;
import com.aihub.repository.UsageLogRepository;
import com.aihub.repository.UserRepository;
import com.aihub.util.IpUtils;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;

import jakarta.servlet.http.HttpServletRequest;
import java.math.BigDecimal;
import java.time.Duration;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class ChatService {

    private static final Logger log = LoggerFactory.getLogger(ChatService.class);

    private static final Map<String, String> PROVIDER_MAP = Map.ofEntries(
            Map.entry("gpt-4o", "openai"),
            Map.entry("gpt-4o-mini", "openai"),
            Map.entry("gpt-4-turbo", "openai"),
            Map.entry("gpt-3.5-turbo", "openai"),
            Map.entry("claude-opus-4-7", "anthropic"),
            Map.entry("claude-sonnet-4-7", "anthropic"),
            Map.entry("claude-3-opus", "anthropic"),
            Map.entry("claude-3-sonnet", "anthropic"),
            Map.entry("deepseek-chat", "deepseek"),
            Map.entry("deepseek-coder", "deepseek"),
            Map.entry("gemini-1.5-pro", "google"),
            Map.entry("gemini-1.5-flash", "google"),
            Map.entry("gemini-pro", "google"),
            Map.entry("moonshot-v1-8k", "moonshot"),
            Map.entry("moonshot-v1-32k", "moonshot"),
            Map.entry("moonshot-v1-128k", "moonshot"),
            Map.entry("glm-4", "zhipu"),
            Map.entry("glm-4v", "zhipu"),
            Map.entry("glm-3-turbo", "zhipu"),
            Map.entry("qwen-plus", "alibaba"),
            Map.entry("qwen-turbo", "alibaba"),
            Map.entry("qwen-max", "alibaba")
    );

    private static final Map<String, String> BASE_URLS = Map.of(
            "openai", "https://api.openai.com/v1",
            "anthropic", "https://api.anthropic.com/v1",
            "deepseek", "https://api.deepseek.com/v1",
            "google", "https://generativelanguage.googleapis.com/v1beta",
            "moonshot", "https://api.moonshot.cn/v1",
            "zhipu", "https://open.anthropic.com/api/paas/v4",
            "alibaba", "https://api.anthropic.com/compatible-mode/v1"
    );

    private static final Map<String, String> API_KEY_HEADERS = Map.of(
            "openai", "Authorization",
            "anthropic", "x-api-key",
            "deepseek", "Authorization",
            "google", "Authorization",
            "moonshot", "Authorization",
            "zhipu", "Authorization",
            "alibaba", "Authorization"
    );

    private final ApiKeyRepository apiKeyRepository;
    private final UserRepository userRepository;
    private final PlatformKeyRepository platformKeyRepository;
    private final ModelPriceRepository modelPriceRepository;
    private final UsageLogRepository usageLogRepository;
    private final RegionService regionService;
    private final WebClient webClient;
    private final ObjectMapper objectMapper;

    public ChatService(ApiKeyRepository apiKeyRepository, UserRepository userRepository,
                       PlatformKeyRepository platformKeyRepository, ModelPriceRepository modelPriceRepository,
                       UsageLogRepository usageLogRepository, RegionService regionService,
                       WebClient webClient) {
        this.apiKeyRepository = apiKeyRepository;
        this.userRepository = userRepository;
        this.platformKeyRepository = platformKeyRepository;
        this.modelPriceRepository = modelPriceRepository;
        this.usageLogRepository = usageLogRepository;
        this.regionService = regionService;
        this.webClient = webClient;
        this.objectMapper = new ObjectMapper();
    }

    public record ChatResult(Map<String, Object> result, int statusCode, String error) {}

    @SuppressWarnings("unchecked")
    @Transactional
    public ChatResult proxyChat(Map<String, Object> requestMap, String bearerToken, HttpServletRequest httpRequest) {
        String model = (String) requestMap.get("model");

        // 1. Validate API Key
        if (bearerToken == null || !bearerToken.startsWith("sk-")) {
            return new ChatResult(null, 401, "Invalid API key format");
        }

        Optional<ApiKey> apiKeyOpt = apiKeyRepository.findByApiKey(bearerToken);
        if (apiKeyOpt.isEmpty()) {
            return new ChatResult(null, 401, "Invalid API key");
        }

        ApiKey apiKey = apiKeyOpt.get();
        if (!Boolean.TRUE.equals(apiKey.getIsActive())) {
            return new ChatResult(null, 401, "API key is inactive");
        }

        Long userId = apiKey.getUserId();
        Optional<User> userOpt = userRepository.findById(userId);
        if (userOpt.isEmpty()) {
            return new ChatResult(null, 401, "User not found");
        }

        User user = userOpt.get();
        if (!Boolean.TRUE.equals(user.getEnabled())) {
            return new ChatResult(null, 401, "User account is disabled");
        }

        // 2. Get/Detect user region
        String region = user.getRegion();
        if (region == null) {
            String clientIp = IpUtils.getClientIp(httpRequest);
            region = regionService.getRegion(clientIp);
            user.setRegion(region);
            userRepository.save(user);
        }

        // 3. Validate model
        if (model == null || model.isEmpty()) {
            return new ChatResult(null, 400, "Model is required");
        }

        // 4. Get model price
        Optional<ModelPrice> priceOpt = modelPriceRepository.findByModelIdAndIsActiveTrue(model);
        if (priceOpt.isEmpty()) {
            return new ChatResult(null, 422, "Model not found or disabled: " + model);
        }
        ModelPrice price = priceOpt.get();

        // 5. Check balance (estimate based on messages)
        List<Map<String, String>> messages = (List<Map<String, String>>) requestMap.get("messages");
        int estimatedTokens = (messages != null ? messages.size() : 0) * 100;
        BigDecimal estimatedCost = BigDecimal.valueOf(estimatedTokens / 1000.0)
                .multiply(price.getInputPrice().add(price.getOutputPrice()));

        if (user.getBalance().compareTo(estimatedCost) < 0) {
            return new ChatResult(null, 402, "Insufficient balance");
        }

        // 6. Select platform key based on provider and region
        String provider = PROVIDER_MAP.getOrDefault(model, null);
        if (provider == null) {
            return new ChatResult(null, 422, "Provider not configured for model: " + model);
        }

        PlatformKey platformKey = selectPlatformKey(provider, region);
        if (platformKey == null) {
            return new ChatResult(null, 503, "No available platform key for this region");
        }

        // 7. Build and send upstream request
        long startTime = System.currentTimeMillis();
        UsageLog usageLog = new UsageLog();
        usageLog.setUserId(userId);
        usageLog.setApiKeyId(apiKey.getId());
        usageLog.setModelId(model);
        usageLog.setRequestType("chat_completion");

        try {
            Map<String, Object> response = sendUpstreamRequest(provider, platformKey.getApiKey(), model, requestMap);
            long responseTime = System.currentTimeMillis() - startTime;

            // Parse usage from response
            int inputTokens = 0;
            int outputTokens = 0;
            BigDecimal cost = BigDecimal.ZERO;

            try {
                if (response.containsKey("usage")) {
                    Map<String, Object> usage = (Map<String, Object>) response.get("usage");
                    inputTokens = ((Number) usage.getOrDefault("prompt_tokens", 0)).intValue();
                    outputTokens = ((Number) usage.getOrDefault("completion_tokens", 0)).intValue();

                    // Calculate cost
                    BigDecimal inputCost = price.getInputPrice()
                            .multiply(BigDecimal.valueOf(inputTokens))
                            .divide(BigDecimal.valueOf(1000), 6, BigDecimal.ROUND_HALF_UP);
                    BigDecimal outputCost = price.getOutputPrice()
                            .multiply(BigDecimal.valueOf(outputTokens))
                            .divide(BigDecimal.valueOf(1000), 6, BigDecimal.ROUND_HALF_UP);
                    cost = inputCost.add(outputCost);
                }
            } catch (Exception e) {
                log.warn("Failed to parse usage from response", e);
            }

            // Update usage log
            usageLog.setInputTokens(inputTokens);
            usageLog.setOutputTokens(outputTokens);
            usageLog.setCost(cost);
            usageLog.setResponseTimeMs((int) responseTime);
            usageLog.setStatus("success");
            usageLogRepository.save(usageLog);

            // Deduct balance
            if (cost.compareTo(BigDecimal.ZERO) > 0) {
                user.setBalance(user.getBalance().subtract(cost));
                userRepository.save(user);
            }

            return new ChatResult(response, 200, null);

        } catch (WebClientResponseException e) {
            long responseTime = System.currentTimeMillis() - startTime;
            usageLog.setResponseTimeMs((int) responseTime);
            usageLog.setStatus("error");
            usageLog.setErrorMessage(e.getMessage());
            usageLogRepository.save(usageLog);

            log.error("Upstream API error: {} - {}", e.getStatusCode(), e.getResponseBodyAsString());

            try {
                Map<String, Object> errorBody = objectMapper.readValue(e.getResponseBodyAsString(), Map.class);
                String errorMessage = extractErrorMessage(errorBody);
                return new ChatResult(errorBody, e.getStatusCode().value(), errorMessage);
            } catch (Exception ex) {
                return new ChatResult(null, e.getStatusCode().value(), e.getMessage());
            }

        } catch (Exception e) {
            long responseTime = System.currentTimeMillis() - startTime;
            usageLog.setResponseTimeMs((int) responseTime);
            usageLog.setStatus("error");
            usageLog.setErrorMessage(e.getMessage());
            usageLogRepository.save(usageLog);

            log.error("Unexpected error during proxy", e);
            return new ChatResult(null, 500, "QCode转发该请求处理异常，请稍后重试，建议退出cc重新打开继续，退出前可以复制粘贴最近任务内容、新开后贴给CC让它继续。更多信息查看QCode.cc: " + e.getMessage());
        }
    }

    private PlatformKey selectPlatformKey(String provider, String region) {
        // 1. Exact region match
        List<PlatformKey> keys = platformKeyRepository.findByPlatformAndRegionAndIsActiveTrue(provider, region);
        if (!keys.isEmpty()) {
            log.debug("Found platform key for provider={}, region={}", provider, region);
            return keys.get(0);
        }

        // 2. GLOBAL fallback
        keys = platformKeyRepository.findByPlatformAndRegionAndIsActiveTrue(provider, "GLOBAL");
        if (!keys.isEmpty()) {
            log.debug("Found GLOBAL fallback platform key for provider={}", provider);
            return keys.get(0);
        }

        log.warn("No available platform key for provider={}, region={}", provider, region);
        return null;
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> sendUpstreamRequest(String provider, String apiKey, String model,
                                                      Map<String, Object> requestMap) {
        String baseUrl = BASE_URLS.get(provider);
        String apiKeyHeader = API_KEY_HEADERS.get(provider);

        if (baseUrl == null || apiKeyHeader == null) {
            throw new RuntimeException("Unknown provider: " + provider);
        }

        WebClient.RequestBodySpec requestSpec = webClient.post()
                .uri(baseUrl + "/chat/completions")
                .contentType(org.springframework.http.MediaType.APPLICATION_JSON);

        // Add auth header based on provider
        if ("anthropic".equals(provider)) {
            requestSpec.header(apiKeyHeader, apiKey)
                    .header("anthropic-version", "2023-06-01");
            // Convert OpenAI format to Anthropic format
            Map<String, Object> anthropicRequest = convertToAnthropicRequest(requestMap);
            return webClient.post()
                    .uri("https://api.anthropic.com/v1/messages")
                    .contentType(org.springframework.http.MediaType.APPLICATION_JSON)
                    .header("x-api-key", apiKey)
                    .header("anthropic-version", "2023-06-01")
                    .bodyValue(anthropicRequest)
                    .retrieve()
                    .bodyToMono(Map.class)
                    .map(this::convertFromAnthropicResponse)
                    .block(Duration.ofSeconds(120));
        } else {
            requestSpec.header(apiKeyHeader, "Bearer " + apiKey);
            return requestSpec
                    .bodyValue(requestMap)
                    .retrieve()
                    .bodyToMono(Map.class)
                    .block(Duration.ofSeconds(120));
        }
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> convertToAnthropicRequest(Map<String, Object> requestMap) {
        Map<String, Object> anthropicRequest = new HashMap<>();

        String model = (String) requestMap.get("model");
        // Map model names
        if (model != null && model.contains("claude")) {
            anthropicRequest.put("model", model);
        } else {
            anthropicRequest.put("model", "claude-sonnet-4-7");
        }

        List<Map<String, String>> messages = (List<Map<String, String>>) requestMap.get("messages");
        if (messages != null) {
            List<Map<String, Object>> anthropicMessages = messages.stream()
                    .map(msg -> {
                        Map<String, Object> m = new HashMap<>();
                        m.put("role", msg.get("role"));
                        m.put("content", msg.get("content"));
                        return m;
                    })
                    .toList();
            anthropicRequest.put("messages", anthropicMessages);
        }

        Object maxTokens = requestMap.get("max_tokens");
        if (maxTokens != null) {
            anthropicRequest.put("max_tokens", maxTokens);
        } else {
            anthropicRequest.put("max_tokens", 4096);
        }

        Object temperature = requestMap.get("temperature");
        if (temperature != null) {
            anthropicRequest.put("temperature", temperature);
        }

        return anthropicRequest;
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> convertFromAnthropicResponse(Map<String, Object> anthropicResponse) {
        Map<String, Object> openaiResponse = new HashMap<>();
        openaiResponse.put("id", anthropicResponse.get("id"));
        openaiResponse.put("object", "chat.completion");
        openaiResponse.put("created", anthropicResponse.get("created"));
        openaiResponse.put("model", anthropicResponse.get("model"));

        // Convert Anthropic usage to OpenAI format
        Map<String, Object> anthropicUsage = (Map<String, Object>) anthropicResponse.get("usage");
        if (anthropicUsage != null) {
            Map<String, Object> usage = new HashMap<>();
            usage.put("prompt_tokens", anthropicUsage.get("input_tokens"));
            usage.put("completion_tokens", anthropicUsage.get("output_tokens"));
            usage.put("total_tokens", ((Number) anthropicUsage.getOrDefault("input_tokens", 0)).intValue()
                    + ((Number) anthropicUsage.getOrDefault("output_tokens", 0)).intValue());
            openaiResponse.put("usage", usage);
        }

        // Convert Anthropic content to OpenAI format
        List<Map<String, Object>> anthropicContent = (List<Map<String, Object>>) anthropicResponse.get("content");
        if (anthropicContent != null && !anthropicContent.isEmpty()) {
            Map<String, Object> anthropicText = anthropicContent.get(0);
            if ("text".equals(anthropicText.get("type"))) {
                Map<String, Object> choice = new HashMap<>();
                choice.put("index", 0);

                Map<String, Object> message = new HashMap<>();
                message.put("role", "assistant");
                message.put("content", anthropicText.get("text"));
                choice.put("message", message);

                choice.put("finish_reason", anthropicResponse.get("stop_reason"));
                openaiResponse.put("choices", List.of(choice));
            }
        }

        return openaiResponse;
    }

    private String extractErrorMessage(Map<String, Object> errorBody) {
        if (errorBody.containsKey("error")) {
            Object error = errorBody.get("error");
            if (error instanceof Map) {
                Map<String, Object> errorMap = (Map<String, Object>) error;
                if (errorMap.containsKey("message")) {
                    return (String) errorMap.get("message");
                }
            } else if (error instanceof String) {
                return (String) error;
            }
        }
        return "Unknown error";
    }
}
