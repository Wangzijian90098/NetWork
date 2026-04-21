package com.aihub.service;

import com.aihub.entity.UsageLog;
import com.aihub.repository.UsageLogRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class UsageService {

    private final UsageLogRepository usageLogRepository;

    public UsageService(UsageLogRepository usageLogRepository) {
        this.usageLogRepository = usageLogRepository;
    }

    public Map<String, Object> getUsageSummary(Long userId, int days) {
        LocalDateTime since = LocalDateTime.now().minusDays(days);

        Integer inputTokens = usageLogRepository.sumInputTokens(userId, since);
        Integer outputTokens = usageLogRepository.sumOutputTokens(userId, since);
        BigDecimal totalCost = usageLogRepository.sumCost(userId, since);

        List<UsageLog> logs = usageLogRepository.findByUserIdAndCreatedAtAfter(userId, since);

        Map<String, Object> summary = new LinkedHashMap<>();
        summary.put("totalRequests", logs.size());
        summary.put("totalInputTokens", inputTokens != null ? inputTokens : 0);
        summary.put("totalOutputTokens", outputTokens != null ? outputTokens : 0);
        summary.put("totalCost", totalCost != null ? totalCost : BigDecimal.ZERO);

        return summary;
    }
}
