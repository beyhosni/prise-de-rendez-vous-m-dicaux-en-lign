package com.medical.payment.repository;

import com.medical.payment.domain.Payment;
import com.medical.payment.domain.PaymentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long> {

    Optional<Payment> findByAppointmentId(Long appointmentId);

    List<Payment> findByAppointmentIdIn(List<Long> appointmentIds);

    List<Payment> findByStatus(PaymentStatus status);

    List<Payment> findByStripePaymentIntentId(String stripePaymentIntentId);

    List<Payment> findByStripeSessionId(String stripeSessionId);
}
