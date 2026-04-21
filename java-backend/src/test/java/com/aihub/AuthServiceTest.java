package com.aihub;

import com.aihub.dto.request.LoginRequest;
import com.aihub.dto.request.RegisterRequest;
import com.aihub.entity.User;
import com.aihub.repository.UserRepository;
import com.aihub.service.AuthService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class AuthServiceTest {

    @Autowired
    private AuthService authService;

    @Autowired
    private UserRepository userRepository;

    @BeforeEach
    void setUp() {
        userRepository.deleteAll();
    }

    @Test
    void register_shouldCreateUser() {
        RegisterRequest request = new RegisterRequest();
        request.setEmail("test@example.com");
        request.setPassword("password123");

        boolean result = authService.register(request);

        assertTrue(result);
        assertTrue(userRepository.existsByEmail("test@example.com"));
    }

    @Test
    void register_shouldRejectDuplicateEmail() {
        RegisterRequest request = new RegisterRequest();
        request.setEmail("test@example.com");
        request.setPassword("password123");

        authService.register(request);
        boolean result = authService.register(request);

        assertFalse(result);
    }

    @Test
    void register_shouldAcceptRegion() {
        RegisterRequest request = new RegisterRequest();
        request.setEmail("cn@example.com");
        request.setPassword("password123");
        request.setRegion("CN");

        authService.register(request);

        Optional<User> user = userRepository.findByEmail("cn@example.com");
        assertTrue(user.isPresent());
        assertEquals("CN", user.get().getRegion());
    }

    @Test
    void login_shouldReturnToken() {
        RegisterRequest registerRequest = new RegisterRequest();
        registerRequest.setEmail("login@example.com");
        registerRequest.setPassword("password123");
        authService.register(registerRequest);

        LoginRequest loginRequest = new LoginRequest();
        loginRequest.setEmail("login@example.com");
        loginRequest.setPassword("password123");

        Optional<String> token = authService.login(loginRequest);

        assertTrue(token.isPresent());
        assertTrue(token.get().startsWith("eyJ"));
    }

    @Test
    void login_shouldRejectWrongPassword() {
        RegisterRequest registerRequest = new RegisterRequest();
        registerRequest.setEmail("wrong@example.com");
        registerRequest.setPassword("password123");
        authService.register(registerRequest);

        LoginRequest loginRequest = new LoginRequest();
        loginRequest.setEmail("wrong@example.com");
        loginRequest.setPassword("wrongpassword");

        Optional<String> token = authService.login(loginRequest);

        assertTrue(token.isEmpty());
    }
}
