package com.aihub.repository;

import com.aihub.entity.ModelPrice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ModelPriceRepository extends JpaRepository<ModelPrice, Long> {

    Optional<ModelPrice> findByModelIdAndIsActiveTrue(String modelId);

    List<ModelPrice> findByIsActiveTrue();
}
