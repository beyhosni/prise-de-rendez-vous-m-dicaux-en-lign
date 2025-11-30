package com.medical.payment.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

@Service
public class AppointmentServiceClient {

    private final RestTemplate restTemplate;
    private final String appointmentServiceUrl;

    public AppointmentServiceClient(RestTemplate restTemplate, 
                                   @Value("${appointment.service.url}") String appointmentServiceUrl) {
        this.restTemplate = restTemplate;
        this.appointmentServiceUrl = appointmentServiceUrl;
    }

    /**
     * Récupère les informations d'un rendez-vous
     */
    public Map<String, Object> getAppointmentInfo(Long appointmentId) {
        String url = appointmentServiceUrl + "/api/appointments/" + appointmentId + "/info";
        return restTemplate.getForObject(url, Map.class);
    }

    /**
     * Notifie le service de rendez-vous qu'un paiement a été confirmé
     */
    public void confirmPayment(Long appointmentId) {
        String url = appointmentServiceUrl + "/api/appointments/" + appointmentId + "/payment-confirmed";
        restTemplate.postForObject(url, null, Void.class);
    }

    /**
     * Notifie le service de rendez-vous qu'un remboursement a été traité
     */
    public void processRefund(Long appointmentId, Double amount, String reason) {
        String url = appointmentServiceUrl + "/api/appointments/" + appointmentId + "/refund-processed";

        Map<String, Object> requestBody = Map.of(
            "amount", amount,
            "reason", reason != null ? reason : ""
        );

        restTemplate.postForObject(url, requestBody, Void.class);
    }
}
