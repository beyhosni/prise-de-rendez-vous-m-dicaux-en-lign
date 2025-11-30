package com.medical.payment.service;

import com.medical.payment.domain.Payment;
import com.medical.payment.domain.PaymentMethod;
import com.medical.payment.domain.PaymentStatus;
import com.medical.payment.dto.PaymentSessionDTO;
import com.medical.payment.repository.PaymentRepository;
import com.stripe.exception.StripeException;
import com.stripe.model.PaymentIntent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final StripeService stripeService;
    private final AppointmentServiceClient appointmentServiceClient;

    /**
     * Récupère un paiement par son ID
     */
    public Payment getPaymentById(Long id) {
        return paymentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Paiement non trouvé avec l'ID: " + id));
    }

    /**
     * Récupère les paiements associés à un rendez-vous
     */
    public List<Payment> getPaymentsByAppointmentId(Long appointmentId) {
        return paymentRepository.findByAppointmentId(appointmentId);
    }

    /**
     * Crée une session de paiement Stripe
     */
    @Transactional
    public PaymentSessionDTO createPaymentSession(Long appointmentId, PaymentMethod paymentMethod, 
                                                  String successUrl, String cancelUrl) {
        try {
            // Vérifier si un paiement existe déjà pour ce rendez-vous
            Optional<Payment> existingPayment = paymentRepository.findByAppointmentId(appointmentId);
            if (existingPayment.isPresent() && existingPayment.get().getStatus() != PaymentStatus.FAILED) {
                throw new RuntimeException("Un paiement existe déjà pour ce rendez-vous");
            }

            // Récupérer les informations du rendez-vous pour obtenir le montant
            Map<String, Object> appointmentInfo = appointmentServiceClient.getAppointmentInfo(appointmentId);
            BigDecimal amount = new BigDecimal(appointmentInfo.get("consultationFee").toString());

            // Créer la session Stripe
            Map<String, String> sessionInfo = stripeService.createCheckoutSession(
                    appointmentId, amount, paymentMethod, successUrl, cancelUrl);

            // Créer ou mettre à jour l'enregistrement de paiement
            Payment payment = existingPayment.orElseGet(() -> Payment.builder()
                    .appointmentId(appointmentId)
                    .amount(amount)
                    .paymentMethod(paymentMethod)
                    .status(PaymentStatus.PENDING)
                    .build());

            payment.setStripeSessionId(sessionInfo.get("sessionId"));
            payment = paymentRepository.save(payment);

            return PaymentSessionDTO.builder()
                    .sessionId(sessionInfo.get("sessionId"))
                    .paymentUrl(sessionInfo.get("paymentUrl"))
                    .build();

        } catch (StripeException e) {
            log.error("Erreur lors de la création de la session de paiement: {}", e.getMessage());
            throw new RuntimeException("Erreur lors de la création de la session de paiement", e);
        }
    }

    /**
     * Confirme un paiement après traitement par Stripe
     */
    @Transactional
    public Payment confirmPayment(String paymentIntentId) {
        try {
            // Récupérer le PaymentIntent depuis Stripe
            PaymentIntent paymentIntent = stripeService.retrievePaymentIntent(paymentIntentId);

            // Récupérer l'ID du rendez-vous depuis les métadonnées
            String appointmentIdStr = paymentIntent.getMetadata().get("appointmentId");
            if (appointmentIdStr == null) {
                throw new RuntimeException("ID de rendez-vous manquant dans les métadonnées du paiement");
            }
            Long appointmentId = Long.valueOf(appointmentIdStr);

            // Récupérer le paiement associé
            Payment payment = paymentRepository.findByAppointmentId(appointmentId)
                    .orElseThrow(() -> new RuntimeException("Aucun paiement trouvé pour le rendez-vous: " + appointmentId));

            // Mettre à jour les informations du paiement
            payment.setStripePaymentIntentId(paymentIntentId);
            payment.setStatus(stripeService.convertStripeStatus(paymentIntent.getStatus()));

            if (payment.getStatus() == PaymentStatus.PAID) {
                payment.setPaidAt(LocalDateTime.now());
                // Notifier le service de rendez-vous que le paiement a été effectué
                appointmentServiceClient.confirmPayment(appointmentId);
            }

            return paymentRepository.save(payment);

        } catch (StripeException e) {
            log.error("Erreur lors de la confirmation du paiement: {}", e.getMessage());
            throw new RuntimeException("Erreur lors de la confirmation du paiement", e);
        }
    }

    /**
     * Traite un remboursement
     */
    @Transactional
    public Payment processRefund(Long paymentId, Double amount, String reason) {
        Payment payment = getPaymentById(paymentId);

        if (payment.getStatus() != PaymentStatus.PAID) {
            throw new RuntimeException("Impossible de rembourser un paiement qui n'est pas au statut PAYED");
        }

        try {
            // Convertir le montant en centimes
            Long amountInCents = null;
            if (amount != null) {
                amountInCents = BigDecimal.valueOf(amount).multiply(BigDecimal.valueOf(100)).longValue();
            }

            // Créer le remboursement via Stripe
            String refundId = stripeService.createRefund(payment.getStripePaymentIntentId(), amountInCents);

            // Mettre à jour le statut du paiement
            payment.setStatus(PaymentStatus.REFUNDED);
            payment.setRefundedAt(LocalDateTime.now());

            // Notifier le service de rendez-vous du remboursement
            appointmentServiceClient.processRefund(payment.getAppointmentId(), amount, reason);

            return paymentRepository.save(payment);

        } catch (Exception e) {
            log.error("Erreur lors du traitement du remboursement: {}", e.getMessage());
            throw new RuntimeException("Erreur lors du traitement du remboursement", e);
        }
    }
}
