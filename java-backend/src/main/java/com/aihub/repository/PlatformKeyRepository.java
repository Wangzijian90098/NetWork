package com.aihub.repository;

import com.aihub.entity.PlatformKey;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PlatformKeyRepository extends JpaRepository<PlatformKey, Long> {

    List<PlatformKey> findByPlatformAndRegionAndIsActiveTrue(String platform, String region);
}
