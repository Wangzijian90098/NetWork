package com.aihub.service;

import com.aihub.entity.UsageLog;
import com.aihub.repository.UsageLogRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

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

        // 计算配额相关
        summary.put("quota", 1000000);  // 模拟配额
        summary.put("used_quota", totalCost != null ? totalCost.multiply(BigDecimal.valueOf(1000000)).intValue() : 0);

        return summary;
    }

    public List<Map<String, Object>> getUsageTrend(Long userId, int days) {
        LocalDateTime since = LocalDateTime.now().minusDays(days);
        List<UsageLog> logs = usageLogRepository.findByUserIdAndCreatedAtAfter(userId, since);

        // 按日期分组
        Map<String, List<UsageLog>> byDate = logs.stream()
                .collect(Collectors.groupingBy(log ->
                        log.getCreatedAt().toLocalDate().format(DateTimeFormatter.ofPattern("MM-dd"))));

        // 生成最近 N 天的数据
        List<Map<String, Object>> trend = new ArrayList<>();
        LocalDate today = LocalDate.now();

        for (int i = days - 1; i >= 0; i--) {
            LocalDate date = today.minusDays(i);
            String dateStr = date.format(DateTimeFormatter.ofPattern("MM-dd"));
            String dayName = date.getDayOfWeek().getDisplayName(java.time.format.TextStyle.SHORT, Locale.CHINA);

            List<UsageLog> dayLogs = byDate.getOrDefault(dateStr, List.of());

            int totalTokens = dayLogs.stream()
                    .mapToInt(log -> log.getInputTokens() + log.getOutputTokens())
                    .sum();

            Map<String, Object> dayData = new LinkedHashMap<>();
            dayData.put("date", dateStr);
            dayData.put("day", dayName);
            dayData.put("tokens", totalTokens);
            dayData.put("requests", dayLogs.size());

            // 按模型统计
            Map<String, Integer> modelTokens = new LinkedHashMap<>();
            dayLogs.forEach(log -> {
                modelTokens.merge(log.getModelId(), log.getInputTokens() + log.getOutputTokens(), Integer::sum);
            });
            modelTokens.forEach(dayData::put);

            trend.add(dayData);
        }

        return trend;
    }

    public List<Map<String, Object>> getModelDistribution(Long userId) {
        LocalDateTime since = LocalDateTime.now().minusDays(30);
        List<UsageLog> logs = usageLogRepository.findByUserIdAndCreatedAtAfter(userId, since);

        // 按模型分组统计
        Map<String, Integer> modelTokens = new LinkedHashMap<>();
        logs.forEach(log -> {
            String model = log.getModelId();
            int tokens = log.getInputTokens() + log.getOutputTokens();
            modelTokens.merge(model, tokens, Integer::sum);
        });

        int totalTokens = modelTokens.values().stream().mapToInt(Integer::intValue()).sum();

        return modelTokens.entrySet().stream()
                .map(entry -> {
                    Map<String, Object> item = new LinkedHashMap<>();
                    item.put("model", entry.getKey());
                    item.put("tokens", entry.getValue());
                    item.put("percentage", totalTokens > 0
                            ? Math.round(entry.getValue() * 100.0 / totalTokens * 10) / 10.0
                            : 0);
                    return item;
                })
                .sorted((a, b) -> Integer.compare(
                        (Integer) b.get("tokens"),
                        (Integer) a.get("tokens")))
                .collect(Collectors.toList());
    }
}
