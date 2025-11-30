package com.medical.notification.service;

import com.medical.notification.domain.NotificationTemplate;
import com.medical.notification.dto.SMSDTO;
import com.twilio.Twilio;
import com.twilio.rest.api.v2010.account.Message;
import com.twilio.type.PhoneNumber;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class SMSService {

    @Value("${twilio.account-sid}")
    private String accountSid;

    @Value("${twilio.auth-token}")
    private String authToken;

    @Value("${twilio.trial-number}")
    private String trialNumber;

    /**
     * Envoie un SMS simple
     */
    public void sendSMS(SMSDTO smsDTO) {
        try {
            // Initialiser Twilio
            Twilio.init(accountSid, authToken);

            // Créer et envoyer le message
            Message message = Message.creator(
                    new PhoneNumber(smsDTO.getTo()),
                    new PhoneNumber(trialNumber),
                    smsDTO.getContent()
            ).create();

            log.info("SMS envoyé avec succès à {} avec SID: {}", smsDTO.getTo(), message.getSid());

        } catch (Exception e) {
            log.error("Erreur lors de l'envoi du SMS à {}: {}", smsDTO.getTo(), e.getMessage());
            throw new RuntimeException("Erreur lors de l'envoi du SMS", e);
        }
    }

    /**
     * Génère le contenu d'un SMS à partir d'un template et de variables
     */
    public String generateSMSContent(NotificationTemplate template, Map<String, Object> variables) {
        switch (template) {
            case APPOINTMENT_CONFIRMATION:
                return String.format("Rappel: Votre rendez-vous avec Dr. %s est confirmé pour le %s à %s. %s",
                        variables.get("doctorName"),
                        variables.get("date"),
                        variables.get("time"),
                        variables.containsKey("onlineConsultation") && (Boolean) variables.get("onlineConsultation") 
                                ? "Le lien de consultation sera envoyé 15 minutes avant le rendez-vous." 
                                : "Adresse: " + variables.get("address"));

            case APPOINTMENT_REMINDER:
                return String.format("Rappel: Vous avez un rendez-vous avec Dr. %s demain à %s. %s",
                        variables.get("doctorName"),
                        variables.get("time"),
                        variables.containsKey("onlineConsultation") && (Boolean) variables.get("onlineConsultation") 
                                ? "Le lien de consultation sera envoyé 15 minutes avant." 
                                : "Adresse: " + variables.get("address"));

            case CONSULTATION_REMINDER:
                return String.format("Votre consultation en ligne avec Dr. %s commence dans 15 minutes. Cliquez sur le lien pour rejoindre: %s",
                        variables.get("doctorName"),
                        variables.get("consultationLink"));

            case APPOINTMENT_CANCELLATION:
                return String.format("Votre rendez-vous avec Dr. %s prévu pour le %s a été annulé. Motif: %s",
                        variables.get("doctorName"),
                        variables.get("date"),
                        variables.get("reason"));

            case PAYMENT_CONFIRMATION:
                return String.format("Votre paiement de %.2f € pour le rendez-vous avec Dr. %s a été confirmé. Merci pour votre confiance.",
                        variables.get("amount"),
                        variables.get("doctorName"));

            case PAYMENT_FAILURE:
                return String.format("Le paiement de %.2f € pour votre rendez-vous avec Dr. %s a échoué. Veuillez réessayer ou contacter le support.",
                        variables.get("amount"),
                        variables.get("doctorName"));

            case PASSWORD_RESET:
                return String.format("Votre code de réinitialisation de mot de passe est: %s. Ce code expire dans 15 minutes.",
                        variables.get("resetCode"));

            case ACCOUNT_VERIFICATION:
                return String.format("Votre code de vérification est: %s. Ce code expire dans 15 minutes.",
                        variables.get("verificationCode"));

            default:
                return variables.containsKey("message") ? variables.get("message").toString() : "Notification médicale";
        }
    }
}
