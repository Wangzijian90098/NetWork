package com.aihub;

import com.aihub.entity.User;
import com.aihub.repository.ApiKeyRepository;
import com.aihub.repository.UserRepository;
import com.aihub.service.KeyService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class KeyServiceTest {

    @Autowired
    private KeyService keyService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ApiKeyRepository apiKeyRepository;

    private Long userId;

    @BeforeEach
    void setUp() {
        apiKeyRepository.deleteAll();
        userRepository.deleteAll();

        User user = new User();
        user.setUsername("test@example.com");
        user.setEmail("test@example.com");
        user.setPassword("password");
        user.setBalance(BigDecimal.TEN);
        user = userRepository.save(user);
        userId = user.getId();
    }

    @Test
    void createKey_shouldGenerateValidToken() {
        Map<String, Object> key = keyService.createKey(userId, "Test Key");

        assertNotNull(key.get("apiKey"));
        assertTrue(key.get("apiKey").toString().startsWith("sk-aihub-"));
        assertTrue((Boolean) key.get("isActive"));
    }

    @Test
    void getKeysByUser_shouldReturnUserKeys() {
        keyService.createKey(userId, "Key 1");
        keyService.createKey(userId, "Key 2");

        List<Map<String, Object>> keys = keyService.getKeysByUser(userId);

        assertEquals(2, keys.size());
    }

    @Test
    void revokeKey_shouldChangeStatus() {
        Map<String, Object> key = keyService.createKey(userId, "Test Key");
        Long keyId = (Long) key.get("id");

        boolean result = keyService.revokeKey(userId, keyId);

        assertTrue(result);
        List<Map<String, Object>> keys = keyService.getKeysByUser(userId);
        assertFalse((Boolean) keys.get(0).get("isActive"));
    }

    @Test
    void validateKey_shouldReturnNullForInvalidToken() {
        Map<String, Object> result = keyService.validateKey("invalid-token");

        assertNull(result);
    }

    @Test
    void validateKey_shouldReturnKeyInfo() {
        Map<String, Object> created = keyService.createKey(userId, "Test Key");
        String token = created.get("apiKey").toString();

        Map<String, Object> result = keyService.validateKey(token);

        assertNotNull(result);
        assertEquals(userId, result.get("userId"));
        assertTrue((Boolean) result.get("isActive"));
    }
}
