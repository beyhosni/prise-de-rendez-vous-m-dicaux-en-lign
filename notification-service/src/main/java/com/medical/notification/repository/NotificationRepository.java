package com.medical.notification.repository;

import com.medical.notification.domain.Notification;
import com.medical.notification.domain.NotificationStatus;
import com.medical.notification.domain.NotificationType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {

    List<Notification> findByRecipient(String recipient);

    List<Notification> findByType(NotificationType type);

    List<Notification> findByStatus(NotificationStatus status);

    List<Notification> findByRecipientAndStatus(String recipient, NotificationStatus status);

    List<Notification> findByCreatedAtAfter(LocalDateTime dateTime);
}
