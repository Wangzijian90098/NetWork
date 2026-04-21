package com.aihub.dto.response;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class UserDto {
    private Long id;
    private String email;
    private BigDecimal balance;
    private String role;
    private String region;
}
