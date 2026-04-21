package com.aihub.service;

import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;

@Service
public class RegionService {

    private final HttpClient httpClient = HttpClient.newHttpClient();

    public String getRegion(String ip) {
        // 跳过本地/内网 IP
        if (ip == null || ip.equals("127.0.0.1") || ip.equals("0:0:0:0:0:0:0:1") ||
                ip.startsWith("192.168.") || ip.startsWith("10.") || ip.startsWith("172.")) {
            return "OVERSEAS";
        }

        try {
            String url = "http://ip-api.com/json/" + ip + "?fields=countryCode";
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .timeout(Duration.ofSeconds(5))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            String body = response.body();

            if (body.contains("\"countryCode\":\"CN\"")) {
                return "CN";
            }
            return "OVERSEAS";
        } catch (Exception e) {
            return "OVERSEAS";  // 默认值
        }
    }
}
