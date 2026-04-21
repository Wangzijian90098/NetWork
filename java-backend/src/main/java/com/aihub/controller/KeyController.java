package com.aihub.controller;

import com.aihub.dto.request.CreateKeyRequest;
import com.aihub.dto.response.ApiResponse;
import com.aihub.service.KeyService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/keys")
public class KeyController {

    private final KeyService keyService;

    public KeyController(KeyService keyService) {
        this.keyService = keyService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> listKeys(Authentication auth) {
        Long userId = (Long) auth.getPrincipal();
        return ResponseEntity.ok(ApiResponse.success(keyService.getKeysByUser(userId)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Map<String, Object>>> createKey(
            @RequestBody CreateKeyRequest request,
            Authentication auth) {
        Long userId = (Long) auth.getPrincipal();
        String name = request.getName() != null ? request.getName() : "My API Key";
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(keyService.createKey(userId, name)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> revokeKey(
            @PathVariable Long id,
            Authentication auth) {
        Long userId = (Long) auth.getPrincipal();
        if (keyService.revokeKey(userId, id)) {
            return ResponseEntity.ok(ApiResponse.success("Key 已撤销"));
        }
        return ResponseEntity.notFound().build();
    }
}
