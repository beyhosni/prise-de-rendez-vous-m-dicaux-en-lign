package com.medical.video.service;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Service
@Slf4j
public class JitsiService {

    @Value("${jitsi.domain}")
    private String jitsiDomain;

    @Value("${jitsi.app-id}")
    private String jitsiAppId;

    @Value("${jitsi.app-secret}")
    private String jitsiAppSecret;

    @Value("${jwt.secret}")
    private String jwtSecret;

    /**
     * Génère un ID de salle unique pour une consultation
     */
    public String generateRoomId() {
        return "medical-consultation-" + UUID.randomUUID().toString();
    }

    /**
     * Crée l'URL de la salle de consultation Jitsi
     */
    public String createRoomUrl(String roomId) {
        return String.format("https://%s/%s", jitsiDomain, roomId);
    }

    /**
     * Génère un token JWT pour l'authentification à une salle Jitsi
     */
    public String generateJitsiToken(String roomId, String userName, String userEmail, boolean isModerator) {
        Instant now = Instant.now();

        // Clé secrète pour signer le token
        SecretKey key = Keys.hmacShaKeyFor(jwtSecret.getBytes());

        // Claims du token
        Map<String, Object> claims = new HashMap<>();
        claims.put("iss", jitsiAppId);
        claims.put("aud", "jitsi");
        claims.put("exp", Date.from(now.plus(1, ChronoUnit.HOURS)));
        claims.put("iat", Date.from(now));
        claims.put("sub", jitsiDomain);
        claims.put("room", roomId);

        // Contexte utilisateur
        Map<String, Object> user = new HashMap<>();
        user.put("id", userEmail);
        user.put("name", userName);
        user.put("email", userEmail);
        user.put("moderator", isModerator);
        claims.put("context", Map.of("user", user));

        // Génération du token
        return Jwts.builder()
                .setClaims(claims)
                .signWith(key, SignatureAlgorithm.HS256)
                .compact();
    }

    /**
     * Crée une salle de consultation avec authentification
     */
    public Map<String, String> createConsultationRoom(String roomId, String userName, String userEmail, boolean isModerator) {
        String roomUrl = createRoomUrl(roomId);
        String token = generateJitsiToken(roomId, userName, userEmail, isModerator);

        return Map.of(
            "roomUrl", roomUrl,
            "token", token
        );
    }
}
