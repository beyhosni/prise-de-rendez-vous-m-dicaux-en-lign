package com.medical.notification.dto;

import com.medical.notification.domain.NotificationTemplate;
import com.medical.notification.domain.NotificationType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SendBulkNotificationDTO {
    private List<String> recipients;
    private NotificationType type;
    private NotificationTemplate template;
    private String variables;
}
