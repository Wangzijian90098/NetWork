package com.aihub.config;

import com.aihub.entity.ModelPrice;
import com.aihub.entity.User;
import com.aihub.repository.ModelPriceRepository;
import com.aihub.repository.UserRepository;
import com.aihub.security.PasswordEncoder;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.List;

@Component
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final ModelPriceRepository modelPriceRepository;
    private final PasswordEncoder passwordEncoder;

    public DataInitializer(UserRepository userRepository, ModelPriceRepository modelPriceRepository,
                           PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.modelPriceRepository = modelPriceRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        // Initialize admin user
        if (userRepository.findByUsername("admin").isEmpty()) {
            User admin = new User();
            admin.setUsername("admin");
            admin.setPassword(passwordEncoder.encode("admin123"));
            admin.setEmail("admin@aihubs.com");
            admin.setBalance(new BigDecimal("9999.00"));
            admin.setRole("admin");
            userRepository.save(admin);
            System.out.println("[DB] Default admin created: admin / admin123");
        }

        // Initialize model prices
        if (modelPriceRepository.count() == 0) {
            List<ModelPrice> models = List.of(
                    createModel("gpt-4o", "GPT-4o", 0.0025, 0.01),
                    createModel("gpt-4o-mini", "GPT-4o Mini", 0.00015, 0.0006),
                    createModel("claude-opus-4-7", "Claude Opus 4", 0.003, 0.015),
                    createModel("deepseek-chat", "DeepSeek Chat", 0.00014, 0.00028),
                    createModel("gemini-1.5-flash", "Gemini 1.5 Flash", 0.000075, 0.0003),
                    createModel("deepseek-v3", "DeepSeek V3", 0.00014, 0.00028)
            );
            modelPriceRepository.saveAll(models);
            System.out.println("[DB] Model prices initialized: " + models.size() + " models");
        }
    }

    private ModelPrice createModel(String modelId, String modelName, double input, double output) {
        ModelPrice mp = new ModelPrice();
        mp.setModelId(modelId);
        mp.setModelName(modelName);
        mp.setInputPrice(BigDecimal.valueOf(input));
        mp.setOutputPrice(BigDecimal.valueOf(output));
        mp.setUnit("1M");
        mp.setCurrency("USD");
        mp.setIsActive(true);
        return mp;
    }
}
