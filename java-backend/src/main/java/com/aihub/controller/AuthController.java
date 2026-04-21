package com.aihub.controller;

import com.aihub.dto.request.LoginRequest;
import com.aihub.dto.request.RegisterRequest;
import com.aihub.dto.response.ApiResponse;
import com.aihub.dto.response.UserDto;
import com.aihub.service.AuthService;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<Void>> register(@Valid @RequestBody RegisterRequest request) {
        if (authService.register(request)) {
            return ResponseEntity.ok(ApiResponse.success("注册成功"));
        }
        return ResponseEntity.badRequest().body(ApiResponse.error("该邮箱已注册"));
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<Map<String, Object>>> login(
            @Valid @RequestBody LoginRequest request,
            HttpServletResponse response) {

        return authService.login(request)
                .map(token -> {
                    Cookie cookie = new Cookie("token", token);
                    cookie.setHttpOnly(true);
                    cookie.setPath("/");
                    cookie.setMaxAge(7 * 24 * 3600);
                    response.addCookie(cookie);

                    Map<String, Object> data = Map.of("token", token);
                    return ResponseEntity.ok(ApiResponse.success(data));
                })
                .orElse(ResponseEntity.status(401).body(ApiResponse.error("邮箱或密码错误")));
    }

    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Void>> logout(HttpServletResponse response) {
        Cookie cookie = new Cookie("token", "");
        cookie.setHttpOnly(true);
        cookie.setPath("/");
        cookie.setMaxAge(0);
        response.addCookie(cookie);
        return ResponseEntity.ok(ApiResponse.success("已退出登录"));
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UserDto>> getCurrentUser(Authentication auth) {
        if (auth == null) {
            return ResponseEntity.status(401).body(ApiResponse.error("未登录"));
        }
        Long userId = (Long) auth.getPrincipal();
        return authService.getCurrentUser(userId)
                .map(user -> ResponseEntity.ok(ApiResponse.success(user)))
                .orElse(ResponseEntity.notFound().build());
    }
}
