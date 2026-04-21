package com.aihub.service;

import com.aihub.entity.ApiKey;
import com.aihub.repository.ApiKeyRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.util.Base64;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class KeyService {

    private final ApiKeyRepository apiKeyRepository;
    private final SecureRandom secureRandom = new SecureRandom();

    public KeyService(ApiKeyRepository apiKeyRepository) {
        this.apiKeyRepository = apiKeyRepository;
    }

    public List<Map<String, Object>> getKeysByUser(Long userId) {
        return apiKeyRepository.findByUserId(userId).stream()
                .map(this::toMap)
                .toList();
    }

    @Transactional
    public Map<String, Object> createKey(Long userId, String name) {
        ApiKey key = new ApiKey();
        key.setUserId(userId);
        key.setName(name);
        key.setApiKey(generateToken());
        key.setIsActive(true);
        return toMap(apiKeyRepository.save(key));
    }

    @Transactional
    public boolean revokeKey(Long userId, Long keyId) {
        return apiKeyRepository.findById(keyId)
                .filter(key -> key.getUserId().equals(userId) && Boolean.TRUE.equals(key.getIsActive()))
                .map(key -> {
                    key.setIsActive(false);
                    apiKeyRepository.save(key);
                    return true;
                })
                .orElse(false);
    }

    public Map<String, Object> validateKey(String token) {
        return apiKeyRepository.findByApiKey(token)
                .map(key -> {
                    if (!Boolean.TRUE.equals(key.getIsActive())) {
                        return null;
                    }
                    Map<String, Object> result = new java.util.HashMap<>();
                    result.put("id", key.getId());
                    result.put("userId", key.getUserId());
                    result.put("isActive", key.getIsActive());
                    return result;
                })
                .orElse(null);
    }

    private String generateToken() {
        byte[] bytes = new byte[16];
        secureRandom.nextBytes(bytes);
        return "sk-aihub-" + Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private Map<String, Object> toMap(ApiKey key) {
        Map<String, Object> result = new java.util.HashMap<>();
        result.put("id", key.getId());
        result.put("name", key.getName() != null ? key.getName() : "API Key");
        result.put("apiKey", key.getApiKey());
        result.put("isActive", key.getIsActive());
        result.put("createdAt", key.getCreatedAt() != null ? key.getCreatedAt().toString() : "");
        return result;
    }
}
