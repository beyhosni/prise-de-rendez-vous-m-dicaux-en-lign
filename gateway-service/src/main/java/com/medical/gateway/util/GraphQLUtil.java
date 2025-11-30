package com.medical.gateway.util;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.Map;

@Component
@Slf4j
public class GraphQLUtil {

    private final ObjectMapper objectMapper;

    public GraphQLUtil(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    /**
     * Formate un objet d'entrée pour une requête GraphQL
     */
    public String formatInput(Map<String, Object> input) {
        try {
            return objectMapper.writeValueAsString(input);
        } catch (JsonProcessingException e) {
            log.error("Erreur lors du formatage de l'entrée GraphQL: {}", e.getMessage());
            return "{}";
        }
    }

    /**
     * Extrait le token d'authentification des détails de l'utilisateur
     */
    public String getAuthToken(org.springframework.security.core.userdetails.UserDetails userDetails) {
        if (userDetails == null) {
            return null;
        }
        // Dans une implémentation réelle, vous pourriez extraire le token du contexte de sécurité
        // Pour simplifier, nous retournons null et le service de routage gérera l'authentification
        return null;
    }
}
