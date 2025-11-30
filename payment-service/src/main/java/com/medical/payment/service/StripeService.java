package com.medical.payment.service;

import com.medical.payment.domain.Payment;
import com.medical.payment.domain.PaymentMethod;
import com.medical.payment.domain.PaymentStatus;
import com.stripe.Stripe;
import com.stripe.exception.StripeException;
import com.stripe.model.checkout.Session;
import com.stripe.model.PaymentIntent;
import com.stripe.param.checkout.SessionCreateParams;
import com.stripe.param.PaymentIntentCreateParams;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;

@Service
@Slf4j
public class StripeService {

    @Value("${stripe.api.key}")
    private String stripeApiKey;

    @PostConstruct
    public void init() {
        Stripe.apiKey = stripeApiKey;
    }

    /**
     * Crée une session de paiement Stripe Checkout
     */
    public Map<String, String> createCheckoutSession(Long appointmentId, BigDecimal amount, 
                                                    PaymentMethod paymentMethod, 
                                                    String successUrl, String cancelUrl) throws StripeException {

        // Convertir le montant en centimes (Stripe utilise les centimes)
        long amountInCents = amount.multiply(BigDecimal.valueOf(100)).longValue();

        SessionCreateParams.Builder paramsBuilder = SessionCreateParams.builder()
                .addPaymentMethodType(SessionCreateParams.PaymentMethodType.CARD)
                .setMode(SessionCreateParams.Mode.PAYMENT)
                .setSuccessUrl(successUrl)
                .setCancelUrl(cancelUrl)
                .putMetadata("appointmentId", appointmentId.toString())
                .setCurrency("eur")
                .setAmount(amountInCents);

        // Ajouter des informations spécifiques selon la méthode de paiement
        if (paymentMethod == PaymentMethod.PAYPAL) {
            paramsBuilder.addPaymentMethodType(SessionCreateParams.PaymentMethodType.PAYPAL);
        }

        Session session = Session.create(paramsBuilder.build());

        Map<String, String> response = new HashMap<>();
        response.put("sessionId", session.getId());
        response.put("paymentUrl", session.getUrl());

        return response;
    }

    /**
     * Crée un Payment Intent pour un paiement direct
     */
    public String createPaymentIntent(Long appointmentId, BigDecimal amount, PaymentMethod paymentMethod) throws StripeException {
        // Convertir le montant en centimes (Stripe utilise les centimes)
        long amountInCents = amount.multiply(BigDecimal.valueOf(100)).longValue();

        PaymentIntentCreateParams.Builder paramsBuilder = PaymentIntentCreateParams.builder()
                .setAmount(amountInCents)
                .setCurrency("eur")
                .putMetadata("appointmentId", appointmentId.toString())
                .setConfirmationMethod(PaymentIntentCreateParams.ConfirmationMethod.MANUAL);

        // Configurer la méthode de paiement
        switch (paymentMethod) {
            case CREDIT_CARD:
            case DEBIT_CARD:
                paramsBuilder.addPaymentMethodType(PaymentIntentCreateParams.PaymentMethodType.CARD);
                break;
            case PAYPAL:
                paramsBuilder.addPaymentMethodType(PaymentIntentCreateParams.PaymentMethodType.PAYPAL);
                break;
            default:
                paramsBuilder.addPaymentMethodType(PaymentIntentCreateParams.PaymentMethodType.CARD);
        }

        PaymentIntent paymentIntent = PaymentIntent.create(paramsBuilder.build());

        return paymentIntent.getId();
    }

    /**
     * Récupère un Payment Intent par son ID
     */
    public PaymentIntent retrievePaymentIntent(String paymentIntentId) throws StripeException {
        return PaymentIntent.retrieve(paymentIntentId);
    }

    /**
     * Confirme un Payment Intent
     */
    public PaymentIntent confirmPaymentIntent(String paymentIntentId) throws StripeException {
        PaymentIntent paymentIntent = PaymentIntent.retrieve(paymentIntentId);
        return paymentIntent.confirm();
    }

    /**
     * Crée un remboursement
     */
    public String createRefund(String paymentIntentId, Long amountInCents) throws StripeException {
        com.stripe.model.RefundCreateParams params = com.stripe.model.RefundCreateParams.builder()
                .setPaymentIntent(paymentIntentId)
                .setAmount(amountInCents)
                .build();

        com.stripe.model.Refund refund = com.stripe.model.Refund.create(params);
        return refund.getId();
    }

    /**
     * Convertit le statut Stripe en notre statut de paiement
     */
    public PaymentStatus convertStripeStatus(String stripeStatus) {
        switch (stripeStatus) {
            case "requires_payment_method":
            case "requires_confirmation":
            case "requires_action":
            case "processing":
                return PaymentStatus.PENDING;
            case "succeeded":
                return PaymentStatus.PAID;
            case "canceled":
                return PaymentStatus.FAILED;
            default:
                return PaymentStatus.FAILED;
        }
    }
}
