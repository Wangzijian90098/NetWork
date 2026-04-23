package com.aihub.controller;

import com.aihub.dto.response.ApiResponse;
import com.aihub.service.AdminService;
import com.aihub.service.KeyService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final AdminService adminService;
    private final KeyService keyService;

    public AdminController(AdminService adminService, KeyService keyService) {
        this.adminService = adminService;
        this.keyService = keyService;
    }

    @GetMapping("/users")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getUsers() {
        return ResponseEntity.ok(ApiResponse.success(adminService.getUsers()));
    }

    @PostMapping("/users/{userId}/recharge")
    public ResponseEntity<ApiResponse<Void>> recharge(
            @PathVariable Long userId,
            @RequestBody Map<String, Object> body) {

        BigDecimal amount = new BigDecimal(body.get("amount").toString());
        if (adminService.rechargeUser(userId, amount)) {
            return ResponseEntity.ok(ApiResponse.success("充值成功"));
        }
        return ResponseEntity.badRequest().body(ApiResponse.error("充值失败"));
    }

    @GetMapping("/platform-keys")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getPlatformKeys() {
        return ResponseEntity.ok(ApiResponse.success(adminService.getPlatformKeys()));
    }

    @PostMapping("/platform-keys")
    public ResponseEntity<ApiResponse<Map<String, Object>>> addPlatformKey(@RequestBody Map<String, Object> body) {
        String platform = body.get("platform").toString();
        String apiKey = body.get("apiKey").toString();
        String apiSecret = body.getOrDefault("apiSecret", "").toString();
        String region = body.getOrDefault("region", "GLOBAL").toString();

        Map<String, Object> result = adminService.addPlatformKey(platform, apiKey, apiSecret, region);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(result));
    }

    @DeleteMapping("/platform-keys/{keyId}")
    public ResponseEntity<ApiResponse<Void>> deletePlatformKey(@PathVariable Long keyId) {
        if (adminService.deletePlatformKey(keyId)) {
            return ResponseEntity.ok(ApiResponse.success("已删除"));
        }
        return ResponseEntity.notFound().build();
    }

    @GetMapping("/sync")
    public ResponseEntity<ApiResponse<Map<String, Object>>> syncToWorkers() {
        List<Map<String, Object>> keyData = keyService.getAllActiveKeys();

        return ResponseEntity.ok(ApiResponse.success("同步成功", Map.of("keys", keyData)));
    }
}
