package com.aihub.dto.request;

import lombok.Data;

import java.util.List;
import java.util.Map;

@Data
public class ChatRequest {
    private String model;
    private List<Map<String, String>> messages;
    private Double temperature;
    private Integer maxTokens;
}
