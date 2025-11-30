package com.medical.video.service;

import com.medical.video.domain.ConsultationStatus;
import com.medical.video.domain.OnlineConsultation;
import com.medical.video.dto.ConsultationTokenDTO;
import com.medical.video.repository.OnlineConsultationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class VideoService {

    private final OnlineConsultationRepository consultationRepository;
    private final JitsiService jitsiService;
    private final AppointmentServiceClient appointmentServiceClient;

    /**
     * Récupère une consultation par son ID
     */
    public OnlineConsultation getConsultationById(Long id) {
        return consultationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Consultation non trouvée avec l'ID: " + id));
    }

    /**
     * Récupère une consultation par l'ID du rendez-vous
     */
    public OnlineConsultation getConsultationByAppointmentId(Long appointmentId) {
        return consultationRepository.findByAppointmentId(appointmentId)
                .orElseThrow(() -> new RuntimeException("Aucune consultation trouvée pour le rendez-vous: " + appointmentId));
    }

    /**
     * Récupère les consultations de l'utilisateur actuel
     */
    public List<OnlineConsultation> getMyConsultations(String userEmail) {
        // Récupérer les rendez-vous de l'utilisateur via le service de rendez-vous
        List<Long> appointmentIds = appointmentServiceClient.getUserAppointments(userEmail);

        // Filtrer les consultations correspondantes
        return consultationRepository.findAll().stream()
                .filter(consultation -> appointmentIds.contains(consultation.getAppointmentId()))
                .toList();
    }

    /**
     * Crée une consultation vidéo pour un rendez-vous
     */
    @Transactional
    public OnlineConsultation createConsultation(Long appointmentId) {
        // Vérifier si une consultation existe déjà pour ce rendez-vous
        if (consultationRepository.findByAppointmentId(appointmentId).isPresent()) {
            throw new RuntimeException("Une consultation existe déjà pour ce rendez-vous");
        }

        // Générer un ID de salle unique
        String roomId = jitsiService.generateRoomId();

        // Créer l'URL de la salle
        String roomUrl = jitsiService.createRoomUrl(roomId);

        // Créer et sauvegarder la consultation
        OnlineConsultation consultation = OnlineConsultation.builder()
                .appointmentId(appointmentId)
                .roomId(roomId)
                .roomUrl(roomUrl)
                .status(ConsultationStatus.SCHEDULED)
                .build();

        return consultationRepository.save(consultation);
    }

    /**
     * Démarre une consultation (pour le médecin)
     */
    @Transactional
    public ConsultationTokenDTO startConsultation(Long appointmentId, String doctorEmail) {
        OnlineConsultation consultation = getConsultationByAppointmentId(appointmentId);

        // Vérifier que la consultation n'est pas déjà démarrée
        if (consultation.getStatus() != ConsultationStatus.SCHEDULED) {
            throw new RuntimeException("Cette consultation ne peut pas être démarrée");
        }

        // Récupérer les informations du médecin
        Map<String, Object> doctorInfo = appointmentServiceClient.getDoctorInfo(appointmentId);
        String doctorName = doctorInfo.get("firstName") + " " + doctorInfo.get("lastName");

        // Mettre à jour le statut de la consultation
        consultation.setStatus(ConsultationStatus.IN_PROGRESS);
        consultation.setStartedAt(LocalDateTime.now());
        consultationRepository.save(consultation);

        // Générer le token pour le médecin (modérateur)
        Map<String, String> roomInfo = jitsiService.createConsultationRoom(
                consultation.getRoomId(), 
                doctorName, 
                doctorEmail, 
                true
        );

        // Calculer la date d'expiration du token (1 heure)
        LocalDateTime expiresAt = LocalDateTime.now().plusHours(1);

        return ConsultationTokenDTO.builder()
                .token(roomInfo.get("token"))
                .roomUrl(roomInfo.get("roomUrl"))
                .expiresAt(expiresAt)
                .build();
    }

    /**
     * Rejoint une consultation (pour le patient)
     */
    @Transactional
    public ConsultationTokenDTO joinConsultation(Long appointmentId, String patientEmail) {
        OnlineConsultation consultation = getConsultationByAppointmentId(appointmentId);

        // Vérifier que la consultation est en cours
        if (consultation.getStatus() != ConsultationStatus.IN_PROGRESS) {
            throw new RuntimeException("Cette consultation n'est pas encore démarrée");
        }

        // Récupérer les informations du patient
        Map<String, Object> patientInfo = appointmentServiceClient.getPatientInfo(appointmentId);
        String patientName = patientInfo.get("firstName") + " " + patientInfo.get("lastName");

        // Générer le token pour le patient (participant)
        Map<String, String> roomInfo = jitsiService.createConsultationRoom(
                consultation.getRoomId(), 
                patientName, 
                patientEmail, 
                false
        );

        // Calculer la date d'expiration du token (1 heure)
        LocalDateTime expiresAt = LocalDateTime.now().plusHours(1);

        return ConsultationTokenDTO.builder()
                .token(roomInfo.get("token"))
                .roomUrl(roomInfo.get("roomUrl"))
                .expiresAt(expiresAt)
                .build();
    }

    /**
     * Termine une consultation
     */
    @Transactional
    public OnlineConsultation endConsultation(Long appointmentId) {
        OnlineConsultation consultation = getConsultationByAppointmentId(appointmentId);

        // Vérifier que la consultation est en cours
        if (consultation.getStatus() != ConsultationStatus.IN_PROGRESS) {
            throw new RuntimeException("Cette consultation n'est pas en cours");
        }

        // Mettre à jour le statut de la consultation
        consultation.setStatus(ConsultationStatus.COMPLETED);
        consultation.setEndedAt(LocalDateTime.now());

        return consultationRepository.save(consultation);
    }
}
