package com.aihub.service;

import com.aihub.entity.PlatformKey;
import com.aihub.entity.User;
import com.aihub.repository.PlatformKeyRepository;
import com.aihub.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class AdminService {

    private final UserRepository userRepository;
    private final PlatformKeyRepository platformKeyRepository;

    public AdminService(UserRepository userRepository, PlatformKeyRepository platformKeyRepository) {
        this.userRepository = userRepository;
        this.platformKeyRepository = platformKeyRepository;
    }

    public List<Map<String, Object>> getUsers() {
        return userRepository.findAll().stream()
                .map(u -> Map.of(
                        "id", u.getId(),
                        "email", u.getEmail() != null ? u.getEmail() : "",
                        "balance", u.getBalance(),
                        "role", u.getRole(),
                        "region", u.getRegion() != null ? u.getRegion() : ""
                ))
                .toList();
    }

    @Transactional
    public boolean rechargeUser(Long userId, BigDecimal amount) {
        if (amount.compareTo(BigDecimal.ZERO) <= 0) {
            return false;
        }
        Optional<User> userOpt = userRepository.findById(userId);
        if (userOpt.isEmpty()) {
            return false;
        }
        User user = userOpt.get();
        user.setBalance(user.getBalance().add(amount));
        userRepository.save(user);
        return true;
    }

    public List<Map<String, Object>> getPlatformKeys() {
        return platformKeyRepository.findAll().stream()
                .map(pk -> Map.of(
                        "id", pk.getId(),
                        "platform", pk.getPlatform(),
                        "apiKey", pk.getApiKey(),
                        "region", pk.getRegion() != null ? pk.getRegion() : "",
                        "isActive", pk.getIsActive()
                ))
                .toList();
    }

    @Transactional
    public Map<String, Object> addPlatformKey(String platform, String apiKey, String apiSecret, String region) {
        PlatformKey pk = new PlatformKey();
        pk.setPlatform(platform);
        pk.setApiKey(apiKey);
        pk.setApiSecret(apiSecret);
        pk.setRegion(region != null ? region : "GLOBAL");
        pk.setIsActive(true);
        PlatformKey saved = platformKeyRepository.save(pk);
        return Map.of(
                "id", saved.getId(),
                "platform", saved.getPlatform()
        );
    }

    @Transactional
    public boolean deletePlatformKey(Long keyId) {
        Optional<PlatformKey> pkOpt = platformKeyRepository.findById(keyId);
        if (pkOpt.isEmpty()) {
            return false;
        }
        platformKeyRepository.delete(pkOpt.get());
        return true;
    }
}
