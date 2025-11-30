package com.medical.notification.service;

import com.medical.notification.domain.NotificationTemplate;
import com.medical.notification.dto.EmailDTO;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

import java.nio.charset.StandardCharsets;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;
    private final TemplateEngine templateEngine;

    @Value("${spring.mail.username}")
    private String fromEmail;

    /**
     * Envoie un email en utilisant un template Thymeleaf
     */
    public void sendEmailWithTemplate(String to, String subject, NotificationTemplate template, Map<String, Object> variables) {
        try {
            // Créer le message
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, MimeMessageHelper.MULTIPART_MODE_MIXED_RELATED, StandardCharsets.UTF_8.name());

            helper.setFrom(fromEmail);
            helper.setTo(to);
            helper.setSubject(subject);

            // Traiter le template avec les variables
            Context context = new Context();
            context.setVariables(variables);

            String templateName = template.name().toLowerCase() + ".html";
            String htmlContent = templateEngine.process(templateName, context);

            helper.setText(htmlContent, true);

            // Envoyer l'email
            mailSender.send(message);

            log.info("Email envoyé avec succès à {} avec le template {}", to, template);

        } catch (MessagingException e) {
            log.error("Erreur lors de l'envoi de l'email à {}: {}", to, e.getMessage());
            throw new RuntimeException("Erreur lors de l'envoi de l'email", e);
        }
    }

    /**
     * Envoie un email simple sans template
     */
    public void sendSimpleEmail(EmailDTO emailDTO) {
        try {
            // Créer le message
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, MimeMessageHelper.MULTIPART_MODE_MIXED_RELATED, StandardCharsets.UTF_8.name());

            helper.setFrom(fromEmail);
            helper.setTo(emailDTO.getTo());
            helper.setSubject(emailDTO.getSubject());
            helper.setText(emailDTO.getContent(), true);

            // Envoyer l'email
            mailSender.send(message);

            log.info("Email simple envoyé avec succès à {}", emailDTO.getTo());

        } catch (MessagingException e) {
            log.error("Erreur lors de l'envoi de l'email simple à {}: {}", emailDTO.getTo(), e.getMessage());
            throw new RuntimeException("Erreur lors de l'envoi de l'email", e);
        }
    }
}
