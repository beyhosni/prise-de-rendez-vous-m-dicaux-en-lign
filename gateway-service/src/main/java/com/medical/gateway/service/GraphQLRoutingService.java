package com.medical.gateway.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class GraphQLRoutingService {

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    @Value("${auth.service.url}")
    private String authServiceUrl;

    @Value("${patient.service.url}")
    private String patientServiceUrl;

    @Value("${doctor.service.url}")
    private String doctorServiceUrl;

    @Value("${appointment.service.url}")
    private String appointmentServiceUrl;

    @Value("${payment.service.url}")
    private String paymentServiceUrl;

    @Value("${video.service.url}")
    private String videoServiceUrl;

    @Value("${notification.service.url}")
    private String notificationServiceUrl;

    /**
     * Route une requête GraphQL vers le service approprié
     */
    public Map<String, Object> routeGraphQLRequest(String query, Map<String, Object> variables, String authToken) {
        try {
            // Analyser la requête pour déterminer le service cible
            String serviceName = determineServiceFromQuery(query);

            // Construire l'URL du service cible
            String serviceUrl = getServiceUrl(serviceName);

            // Préparer les en-têtes
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            if (authToken != null) {
                headers.set("Authorization", authToken);
            }

            // Construire le corps de la requête
            Map<String, Object> requestBody = Map.of(
                "query", query,
                "variables", variables != null ? variables : Map.of()
            );

            // Envoyer la requête
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);
            return restTemplate.postForObject(serviceUrl + "/graphql", entity, Map.class);

        } catch (JsonProcessingException e) {
            log.error("Erreur lors du traitement de la requête GraphQL: {}", e.getMessage());
            throw new RuntimeException("Erreur lors du traitement de la requête GraphQL", e);
        }
    }

    /**
     * Détermine le service approprié en fonction de la requête GraphQL
     */
    private String determineServiceFromQuery(String query) {
        // Simplification: analyse le nom de la mutation ou de la requête principale
        String normalizedQuery = query.toLowerCase();

        if (normalizedQuery.contains("register") || normalizedQuery.contains("login") || 
            normalizedQuery.contains("logout") || normalizedQuery.contains("refreshtoken")) {
            return "auth";
        } else if (normalizedQuery.contains("patient")) {
            return "patient";
        } else if (normalizedQuery.contains("doctor") || normalizedQuery.contains("availability")) {
            return "doctor";
        } else if (normalizedQuery.contains("appointment") || normalizedQuery.contains("timeslot")) {
            return "appointment";
        } else if (normalizedQuery.contains("payment")) {
            return "payment";
        } else if (normalizedQuery.contains("consultation") || normalizedQuery.contains("video")) {
            return "video";
        } else if (normalizedQuery.contains("notification")) {
            return "notification";
        }

        // Par défaut, utiliser le service d'authentification
        return "auth";
    }

    /**
     * Retourne l'URL du service spécifié
     */
    private String getServiceUrl(String serviceName) {
        switch (serviceName) {
            case "auth":
                return authServiceUrl;
            case "patient":
                return patientServiceUrl;
            case "doctor":
                return doctorServiceUrl;
            case "appointment":
                return appointmentServiceUrl;
            case "payment":
                return paymentServiceUrl;
            case "video":
                return videoServiceUrl;
            case "notification":
                return notificationServiceUrl;
            default:
                return authServiceUrl;
        }
    }
}
