package com.aihub.controller;

import com.aihub.dto.response.ApiResponse;
import com.aihub.service.UsageService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/v1/account")
public class UsageController {

    private final UsageService usageService;

    public UsageController(UsageService usageService) {
        this.usageService = usageService;
    }

    @GetMapping("/usage")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getUsage(
            @RequestParam(defaultValue = "30") int days,
            Authentication auth) {

        Long userId = (Long) auth.getPrincipal();
        Map<String, Object> summary = usageService.getUsageSummary(userId, days);

        Map<String, Object> result = Map.of(
                "period", "last_" + days + "_days",
                "summary", summary
        );

        return ResponseEntity.ok(ApiResponse.success(result));
    }
}
