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
        if (userRepository.findByEmail("admin@aihubs.com").isEmpty()) {
            User admin = new User();
            admin.setUsername("admin");
            admin.setEmail("admin@aihubs.com");
            admin.setPassword(passwordEncoder.encode("admin123"));
            admin.setBalance(new BigDecimal("9999.00"));
            admin.setRole("admin");
            userRepository.save(admin);
            System.out.println("[DB] Default admin created: admin / admin123");
        }

        // Initialize model prices
        if (modelPriceRepository.count() == 0) {
            List<ModelPrice> models = List.of(
                    // OpenAI
                    createModel("gpt-4o", "GPT-4o", 0.0025, 0.01),
                    createModel("gpt-4o-mini", "GPT-4o Mini", 0.00015, 0.0006),
                    createModel("gpt-4-turbo", "GPT-4 Turbo", 0.01, 0.03),
                    createModel("gpt-3.5-turbo", "GPT-3.5 Turbo", 0.0005, 0.0015),
                    // Anthropic
                    createModel("claude-opus-4-7", "Claude Opus 4", 0.003, 0.015),
                    createModel("claude-sonnet-4-7", "Claude Opus 4", 0.0015, 0.008),
                    createModel("claude-3-opus", "Claude 3 Opus", 0.003, 0.015),
                    createModel("claude-3-sonnet", "Claude 3 Sonnet", 0.0015, 0.008),
                    // DeepSeek
                    createModel("deepseek-chat", "DeepSeek Chat", 0.00014, 0.00028),
                    createModel("deepseek-coder", "DeepSeek Coder", 0.00014, 0.00028),
                    // Google
                    createModel("gemini-1.5-pro", "Gemini 1.5 Pro", 0.00125, 0.005),
                    createModel("gemini-1.5-flash", "Gemini 1.5 Flash", 0.000075, 0.0003),
                    // Moonshot
                    createModel("moonshot-v1-8k", "Moonshot V1 8K", 0.0006, 0.0006),
                    // Zhipu
                    createModel("glm-4", "GLM-4", 0.0001, 0.0001),
                    // Alibaba
                    createModel("qwen-plus", "Qwen Plus", 0.0008, 0.002)
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
