package com.aihub.repository;

import com.aihub.entity.UsageLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface UsageLogRepository extends JpaRepository<UsageLog, Long> {

    List<UsageLog> findByUserIdAndCreatedAtAfter(Long userId, LocalDateTime after);

    @Query("SELECT COALESCE(SUM(u.inputTokens), 0) FROM UsageLog u WHERE u.userId = :userId AND u.createdAt >= :after")
    Integer sumInputTokens(@Param("userId") Long userId, @Param("after") LocalDateTime after);

    @Query("SELECT COALESCE(SUM(u.outputTokens), 0) FROM UsageLog u WHERE u.userId = :userId AND u.createdAt >= :after")
    Integer sumOutputTokens(@Param("userId") Long userId, @Param("after") LocalDateTime after);

    @Query("SELECT COALESCE(SUM(u.cost), 0) FROM UsageLog u WHERE u.userId = :userId AND u.createdAt >= :after")
    BigDecimal sumCost(@Param("userId") Long userId, @Param("after") LocalDateTime after);
}
