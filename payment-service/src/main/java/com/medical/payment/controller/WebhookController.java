package com.medical.payment.controller;

import com.medical.payment.service.PaymentService;
import com.stripe.exception.SignatureVerificationException;
import com.stripe.model.Event;
import com.stripe.model.PaymentIntent;
import com.stripe.model.StripeObject;
import com.stripe.net.Webhook;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/webhooks")
@RequiredArgsConstructor
@Slf4j
public class WebhookController {

    private final PaymentService paymentService;

    @Value("${stripe.webhook.secret}")
    private String webhookSecret;

    @PostMapping("/stripe")
    public ResponseEntity<String> handleStripeWebhook(
            @RequestBody String payload,
            @RequestHeader("Stripe-Signature") String sigHeader) {

        try {
            Event event = Webhook.constructEvent(payload, sigHeader, webhookSecret);

            // Traiter l'événement en fonction de son type
            switch (event.getType()) {
                case "payment_intent.succeeded":
                    handlePaymentSucceeded(event);
                    break;

                case "payment_intent.payment_failed":
                    handlePaymentFailed(event);
                    break;

                case "payment_intent.canceled":
                    handlePaymentCanceled(event);
                    break;

                default:
                    log.info("Événement non traité: {}", event.getType());
            }

            return ResponseEntity.ok().build();

        } catch (SignatureVerificationException e) {
            log.error("Erreur de vérification de la signature du webhook: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Signature de webhook invalide");
        } catch (Exception e) {
            log.error("Erreur lors du traitement du webhook Stripe: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    private void handlePaymentSucceeded(Event event) {
        StripeObject stripeObject = event.getDataObjectDeserializer().getObject().orElse(null);

        if (stripeObject instanceof PaymentIntent) {
            PaymentIntent paymentIntent = (PaymentIntent) stripeObject;
            log.info("Paiement réussi pour le PaymentIntent: {}", paymentIntent.getId());

            // Mettre à jour le statut du paiement dans notre base de données
            paymentService.confirmPayment(paymentIntent.getId());
        }
    }

    private void handlePaymentFailed(Event event) {
        StripeObject stripeObject = event.getDataObjectDeserializer().getObject().orElse(null);

        if (stripeObject instanceof PaymentIntent) {
            PaymentIntent paymentIntent = (PaymentIntent) stripeObject;
            log.error("Échec du paiement pour le PaymentIntent: {}", paymentIntent.getId());

            // Mettre à jour le statut du paiement dans notre base de données
            paymentService.confirmPayment(paymentIntent.getId());
        }
    }

    private void handlePaymentCanceled(Event event) {
        StripeObject stripeObject = event.getDataObjectDeserializer().getObject().orElse(null);

        if (stripeObject instanceof PaymentIntent) {
            PaymentIntent paymentIntent = (PaymentIntent) stripeObject;
            log.info("Paiement annulé pour le PaymentIntent: {}", paymentIntent.getId());

            // Mettre à jour le statut du paiement dans notre base de données
            paymentService.confirmPayment(paymentIntent.getId());
        }
    }
}
