package com.aihub.service;

import com.aihub.dto.request.LoginRequest;
import com.aihub.dto.request.RegisterRequest;
import com.aihub.dto.response.UserDto;
import com.aihub.entity.User;
import com.aihub.repository.UserRepository;
import com.aihub.security.PasswordEncoder;
import com.aihub.security.JwtTokenProvider;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.Optional;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder,
                       JwtTokenProvider jwtTokenProvider) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtTokenProvider = jwtTokenProvider;
    }

    @Transactional
    public boolean register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            return false;
        }

        User user = new User();
        user.setUsername(request.getEmail());  // 使用 email 作为 username
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setBalance(new BigDecimal("10.00"));  // 新用户送 $10

        String region = request.getRegion();
        if ("CN".equals(region) || "OVERSEAS".equals(region)) {
            user.setRegion(region);
        }

        userRepository.save(user);
        return true;
    }

    public Optional<String> login(LoginRequest request) {
        return userRepository.findByEmail(request.getEmail())
                .filter(user -> passwordEncoder.matches(request.getPassword(), user.getPassword()))
                .map(user -> jwtTokenProvider.generateToken(user.getId(), user.getEmail(), user.getRole()));
    }

    public Optional<UserDto> getCurrentUser(Long userId) {
        return userRepository.findById(userId)
                .map(this::toDto);
    }

    @Transactional
    public void updateRegion(Long userId, String region) {
        userRepository.findById(userId).ifPresent(user -> {
            user.setRegion(region);
            userRepository.save(user);
        });
    }

    private UserDto toDto(User user) {
        UserDto dto = new UserDto();
        dto.setId(user.getId());
        dto.setEmail(user.getEmail());
        dto.setBalance(user.getBalance());
        dto.setRole(user.getRole());
        dto.setRegion(user.getRegion());
        return dto;
    }
}
