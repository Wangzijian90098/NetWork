package com.aihub.controller;

import com.aihub.service.ChatService;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/v1")
public class ChatController {

    private static final Logger log = LoggerFactory.getLogger(ChatController.class);

    private final ChatService chatService;
    private final ObjectMapper objectMapper;

    public ChatController(ChatService chatService) {
        this.chatService = chatService;
        this.objectMapper = new ObjectMapper();
    }

    @PostMapping("/chat/completions")
    public ResponseEntity<?> chatCompletions(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestBody String requestBody,
            HttpServletRequest httpRequest) {

        // Validate Authorization header
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(401)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(Map.of(
                            "error", Map.of(
                                    "message", "Missing or invalid Authorization header",
                                    "type", "invalid_request_error",
                                    "code", "missing_authorization"
                            )
                    ));
        }

        String bearerToken = authHeader.substring(7);

        // Parse request body
        Map<String, Object> requestMap;
        try {
            requestMap = objectMapper.readValue(requestBody, Map.class);
        } catch (Exception e) {
            log.error("Failed to parse request body", e);
            return ResponseEntity.status(400)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(Map.of(
                            "error", Map.of(
                                    "message", "Invalid JSON in request body",
                                    "type", "invalid_request_error",
                                    "code", "invalid_json"
                            )
                    ));
        }

        // Proxy the chat request
        ChatService.ChatResult result = chatService.proxyChat(requestMap, bearerToken, httpRequest);

        if (result.error() != null) {
            return ResponseEntity.status(result.statusCode())
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(Map.of(
                            "error", Map.of(
                                    "message", result.error(),
                                    "type", "invalid_request_error"
                            )
                    ));
        }

        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_JSON)
                .body(result.result());
    }

    @GetMapping("/models")
    public ResponseEntity<?> listModels() {
        return ResponseEntity.ok(Map.of(
                "object", "list",
                "data", List.of(
                        Map.of("id", "gpt-4o", "object", "model", "owned_by", "openai", "permission", List.of()),
                        Map.of("id", "gpt-4o-mini", "object", "model", "owned_by", "openai", "permission", List.of()),
                        Map.of("id", "gpt-4-turbo", "object", "model", "owned_by", "openai", "permission", List.of()),
                        Map.of("id", "gpt-3.5-turbo", "object", "model", "owned_by", "openai", "permission", List.of()),
                        Map.of("id", "claude-opus-4-7", "object", "model", "owned_by", "anthropic", "permission", List.of()),
                        Map.of("id", "claude-sonnet-4-7", "object", "model", "owned_by", "anthropic", "permission", List.of()),
                        Map.of("id", "deepseek-chat", "object", "model", "owned_by", "deepseek", "permission", List.of()),
                        Map.of("id", "deepseek-coder", "object", "model", "owned_by", "deepseek", "permission", List.of()),
                        Map.of("id", "gemini-1.5-pro", "object", "model", "owned_by", "google", "permission", List.of()),
                        Map.of("id", "gemini-1.5-flash", "object", "model", "owned_by", "google", "permission", List.of()),
                        Map.of("id", "moonshot-v1-8k", "object", "model", "owned_by", "moonshot", "permission", List.of()),
                        Map.of("id", "glm-4", "object", "model", "owned_by", "zhipu", "permission", List.of()),
                        Map.of("id", "qwen-plus", "object", "model", "owned_by", "alibaba", "permission", List.of())
                )
        ));
    }
}
