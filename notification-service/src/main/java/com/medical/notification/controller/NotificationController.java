package com.medical.notification.controller;

import com.medical.notification.domain.Notification;
import com.medical.notification.dto.SendBulkNotificationDTO;
import com.medical.notification.dto.SendNotificationDTO;
import com.medical.notification.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.MutationMapping;
import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Controller;

import java.util.List;
import java.util.Map;

@Controller
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    @QueryMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('DOCTOR') or hasRole('PATIENT')")
    public Notification notification(@Argument Long id) {
        return notificationService.getNotificationById(id);
    }

    @QueryMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('DOCTOR') or hasRole('PATIENT')")
    public List<Notification> notificationsByRecipient(@Argument String recipient) {
        return notificationService.getNotificationsByRecipient(recipient);
    }

    @MutationMapping
    @PreAuthorize("hasRole('ADMIN')")
    public Notification sendNotification(@Argument Map<String, Object> input) {
        SendNotificationDTO dto = SendNotificationDTO.builder()
                .recipient(input.get("recipient").toString())
                .type(com.medical.notification.domain.NotificationType.valueOf(input.get("type").toString()))
                .template(com.medical.notification.domain.NotificationTemplate.valueOf(input.get("template").toString()))
                .variables(input.containsKey("variables") ? input.get("variables").toString() : null)
                .build();

        return notificationService.sendNotification(dto.getRecipient(), dto.getType(), dto.getTemplate(), dto.getVariables());
    }

    @MutationMapping
    @PreAuthorize("hasRole('ADMIN')")
    public List<Notification> sendBulkNotification(@Argument Map<String, Object> input) {
        @SuppressWarnings("unchecked")
        List<String> recipients = (List<String>) input.get("recipients");

        SendBulkNotificationDTO dto = SendBulkNotificationDTO.builder()
                .recipients(recipients)
                .type(com.medical.notification.domain.NotificationType.valueOf(input.get("type").toString()))
                .template(com.medical.notification.domain.NotificationTemplate.valueOf(input.get("template").toString()))
                .variables(input.containsKey("variables") ? input.get("variables").toString() : null)
                .build();

        return notificationService.sendBulkNotifications(dto.getRecipients(), dto.getType(), dto.getTemplate(), dto.getVariables());
    }

    @MutationMapping
    @PreAuthorize("hasRole('ADMIN')")
    public Notification resendNotification(@Argument Long id) {
        return notificationService.resendNotification(id);
    }
}
