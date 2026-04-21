package com.aihub.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "model_prices")
@Data
@NoArgsConstructor
public class ModelPrice {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "model_id", unique = true, nullable = false, length = 100)
    private String modelId;

    @Column(name = "model_name", length = 200)
    private String modelName;

    @Column(name = "input_price", nullable = false, precision = 10, scale = 6)
    private BigDecimal inputPrice;

    @Column(name = "output_price", nullable = false, precision = 10, scale = 6)
    private BigDecimal outputPrice;

    @Column(name = "unit")
    private String unit = "1M";

    @Column(name = "currency")
    private String currency = "USD";

    @Column(name = "is_active")
    private Boolean isActive = true;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
