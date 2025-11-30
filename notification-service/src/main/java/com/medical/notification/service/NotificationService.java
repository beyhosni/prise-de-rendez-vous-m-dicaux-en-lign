package com.medical.notification.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.medical.notification.domain.Notification;
import com.medical.notification.domain.NotificationStatus;
import com.medical.notification.domain.NotificationTemplate;
import com.medical.notification.domain.NotificationType;
import com.medical.notification.dto.EmailDTO;
import com.medical.notification.dto.SMSDTO;
import com.medical.notification.repository.NotificationRepository;
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
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final EmailService emailService;
    private final SMSService smsService;
    private final ObjectMapper objectMapper;

    /**
     * Récupère une notification par son ID
     */
    public Notification getNotificationById(Long id) {
        return notificationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Notification non trouvée avec l'ID: " + id));
    }

    /**
     * Récupère les notifications pour un destinataire
     */
    public List<Notification> getNotificationsByRecipient(String recipient) {
        return notificationRepository.findByRecipient(recipient);
    }

    /**
     * Envoie une notification
     */
    @Transactional
    public Notification sendNotification(String recipient, NotificationType type, NotificationTemplate template, String variables) {
        // Créer la notification
        Notification notification = Notification.builder()
                .recipient(recipient)
                .type(type)
                .template(template)
                .variables(variables)
                .status(NotificationStatus.PENDING)
                .build();

        // Parser les variables
        Map<String, Object> variablesMap;
        try {
            variablesMap = objectMapper.readValue(variables, new TypeReference<>() {});
        } catch (JsonProcessingException e) {
            log.error("Erreur lors du parsing des variables: {}", e.getMessage());
            variablesMap = Map.of();
        }

        // Définir le sujet en fonction du template
        String subject = getSubjectFromTemplate(template, variablesMap);
        notification.setSubject(subject);

        // Générer le contenu en fonction du template
        String content = generateContent(template, variablesMap);
        notification.setContent(content);

        // Sauvegarder la notification
        notification = notificationRepository.save(notification);

        // Envoyer la notification
        try {
            switch (type) {
                case EMAIL:
                    emailService.sendEmailWithTemplate(recipient, subject, template, variablesMap);
                    break;
                case SMS:
                    String smsContent = smsService.generateSMSContent(template, variablesMap);
                    smsService.sendSMS(SMSDTO.builder()
                            .to(recipient)
                            .content(smsContent)
                            .build());
                    break;
                default:
                    log.warn("Type de notification non supporté: {}", type);
                    return notification;
            }

            // Mettre à jour le statut
            notification.setStatus(NotificationStatus.SENT);
            notification.setSentAt(LocalDateTime.now());
            notification = notificationRepository.save(notification);

            log.info("Notification envoyée avec succès à {}: {}", recipient, template);
            return notification;

        } catch (Exception e) {
            log.error("Erreur lors de l'envoi de la notification à {}: {}", recipient, e.getMessage());
            notification.setStatus(NotificationStatus.FAILED);
            return notificationRepository.save(notification);
        }
    }

    /**
     * Envoie des notifications en masse
     */
    @Transactional
    public List<Notification> sendBulkNotifications(List<String> recipients, NotificationType type, 
                                                  NotificationTemplate template, String variables) {
        return recipients.stream()
                .map(recipient -> sendNotification(recipient, type, template, variables))
                .toList();
    }

    /**
     * Renvoie une notification
     */
    @Transactional
    public Notification resendNotification(Long id) {
        Notification notification = getNotificationById(id);

        // Réinitialiser le statut
        notification.setStatus(NotificationStatus.PENDING);
        notification.setSentAt(null);

        // Récupérer les variables
        Map<String, Object> variablesMap;
        try {
            variablesMap = objectMapper.readValue(notification.getVariables(), new TypeReference<>() {});
        } catch (JsonProcessingException e) {
            log.error("Erreur lors du parsing des variables: {}", e.getMessage());
            variablesMap = Map.of();
        }

        // Envoyer la notification
        try {
            switch (notification.getType()) {
                case EMAIL:
                    emailService.sendEmailWithTemplate(
                            notification.getRecipient(), 
                            notification.getSubject(), 
                            notification.getTemplate(), 
                            variablesMap);
                    break;
                case SMS:
                    String smsContent = smsService.generateSMSContent(notification.getTemplate(), variablesMap);
                    smsService.sendSMS(SMSDTO.builder()
                            .to(notification.getRecipient())
                            .content(smsContent)
                            .build());
                    break;
                default:
                    log.warn("Type de notification non supporté: {}", notification.getType());
                    return notification;
            }

            // Mettre à jour le statut
            notification.setStatus(NotificationStatus.SENT);
            notification.setSentAt(LocalDateTime.now());

            log.info("Notification renvoyée avec succès à {}: {}", notification.getRecipient(), notification.getTemplate());
            return notificationRepository.save(notification);

        } catch (Exception e) {
            log.error("Erreur lors du renvoi de la notification à {}: {}", notification.getRecipient(), e.getMessage());
            notification.setStatus(NotificationStatus.FAILED);
            return notificationRepository.save(notification);
        }
    }

    /**
     * Génère le sujet d'un email en fonction du template
     */
    private String getSubjectFromTemplate(NotificationTemplate template, Map<String, Object> variables) {
        switch (template) {
            case APPOINTMENT_CONFIRMATION:
                return "Confirmation de votre rendez-vous médical";
            case APPOINTMENT_REMINDER:
                return "Rappel de votre rendez-vous médical";
            case APPOINTMENT_CANCELLATION:
                return "Annulation de votre rendez-vous médical";
            case PAYMENT_CONFIRMATION:
                return "Confirmation de votre paiement";
            case PAYMENT_FAILURE:
                return "Échec de votre paiement";
            case CONSULTATION_REMINDER:
                return "Votre consultation en ligne commence bientôt";
            case PASSWORD_RESET:
                return "Réinitialisation de votre mot de passe";
            case ACCOUNT_VERIFICATION:
                return "Vérification de votre compte";
            default:
                return "Notification médicale";
        }
    }

    /**
     * Génère le contenu d'une notification en fonction du template
     */
    private String generateContent(NotificationTemplate template, Map<String, Object> variables) {
        // Pour les emails, le contenu sera généré par Thymeleaf
        // Pour les SMS, le contenu sera généré par le SMSService
        return variables.containsKey("message") ? variables.get("message").toString() : "Notification médicale";
    }
}
