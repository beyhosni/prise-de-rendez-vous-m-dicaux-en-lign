package com.medical.video.repository;

import com.medical.video.domain.ConsultationStatus;
import com.medical.video.domain.OnlineConsultation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface OnlineConsultationRepository extends JpaRepository<OnlineConsultation, Long> {

    Optional<OnlineConsultation> findByAppointmentId(Long appointmentId);

    List<OnlineConsultation> findByStatus(ConsultationStatus status);

    List<OnlineConsultation> findByRoomId(String roomId);
}
