package com.medical.video.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.List;
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
     * Récupère les rendez-vous d'un utilisateur
     */
    public List<Long> getUserAppointments(String userEmail) {
        String url = appointmentServiceUrl + "/api/appointments/user/" + userEmail;
        return restTemplate.getForObject(url, List.class);
    }

    /**
     * Récupère les informations du médecin pour un rendez-vous
     */
    public Map<String, Object> getDoctorInfo(Long appointmentId) {
        String url = appointmentServiceUrl + "/api/appointments/" + appointmentId + "/doctor-info";
        return restTemplate.getForObject(url, Map.class);
    }

    /**
     * Récupère les informations du patient pour un rendez-vous
     */
    public Map<String, Object> getPatientInfo(Long appointmentId) {
        String url = appointmentServiceUrl + "/api/appointments/" + appointmentId + "/patient-info";
        return restTemplate.getForObject(url, Map.class);
    }

    /**
     * Notifie le service de rendez-vous qu'une consultation a commencé
     */
    public void notifyConsultationStarted(Long appointmentId) {
        String url = appointmentServiceUrl + "/api/appointments/" + appointmentId + "/consultation-started";
        restTemplate.postForObject(url, null, Void.class);
    }

    /**
     * Notifie le service de rendez-vous qu'une consultation s'est terminée
     */
    public void notifyConsultationEnded(Long appointmentId) {
        String url = appointmentServiceUrl + "/api/appointments/" + appointmentId + "/consultation-ended";
        restTemplate.postForObject(url, null, Void.class);
    }
}
