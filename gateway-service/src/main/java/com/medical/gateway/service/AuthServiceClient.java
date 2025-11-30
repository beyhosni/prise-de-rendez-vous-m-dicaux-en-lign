package com.medical.gateway.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthServiceClient {

    private final RestTemplate restTemplate;

    @Value("${auth.service.url}")
    private String authServiceUrl;

    /**
     * Récupère les informations d'un utilisateur par son email
     */
    public Map<String, Object> getUserInfo(String email) {
        try {
            String url = authServiceUrl + "/api/auth/user-info?email=" + email;
            return restTemplate.getForObject(url, Map.class);
        } catch (Exception e) {
            log.error("Erreur lors de la récupération des informations de l'utilisateur {}: {}", email, e.getMessage());
            throw new RuntimeException("Erreur lors de la récupération des informations de l'utilisateur", e);
        }
    }

    /**
     * Récupère les informations d'un utilisateur par son ID
     */
    public Map<String, Object> getUserInfoById(String userId) {
        try {
            String url = authServiceUrl + "/api/auth/user-info?id=" + userId;
            return restTemplate.getForObject(url, Map.class);
        } catch (Exception e) {
            log.error("Erreur lors de la récupération des informations de l'utilisateur {}: {}", userId, e.getMessage());
            throw new RuntimeException("Erreur lors de la récupération des informations de l'utilisateur", e);
        }
    }

    /**
     * Valide un token JWT
     */
    public boolean validateToken(String token) {
        try {
            String url = authServiceUrl + "/api/auth/validate-token";
            Map<String, Object> requestBody = Map.of("token", token);
            Map<String, Object> response = restTemplate.postForObject(url, requestBody, Map.class);
            return Boolean.parseBoolean(response.get("valid").toString());
        } catch (Exception e) {
            log.error("Erreur lors de la validation du token: {}", e.getMessage());
            return false;
        }
    }
}
