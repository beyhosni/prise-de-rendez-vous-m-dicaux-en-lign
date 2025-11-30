package com.medical.gateway.controller;

import com.medical.gateway.service.GraphQLRoutingService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.graphql.data.method.annotation.MutationMapping;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Controller;

import java.util.Map;

@Controller
@RequiredArgsConstructor
@Slf4j
public class GraphQLController {

    private final GraphQLRoutingService routingService;

    // Auth queries
    @QueryMapping
    public Map<String, Object> me(@AuthenticationPrincipal UserDetails userDetails, 
                                  @Argument Map<String, Object> variables) {
        String query = "query { me { id email role isActive createdAt patient { id firstName lastName dateOfBirth phone address city postalCode insuranceNumber createdAt } doctor { id firstName lastName specialty licenseNumber phone officeAddress city postalCode languages consultationFee bio createdAt } } }";
        return routingService.routeGraphQLRequest(query, variables, getAuthToken(userDetails));
    }

    @QueryMapping
    public Map<String, Object> user(@AuthenticationPrincipal UserDetails userDetails, 
                                   @Argument String id, 
                                   @Argument Map<String, Object> variables) {
        String query = String.format("query { user(id: %s) { id email role isActive createdAt patient { id firstName lastName dateOfBirth phone address city postalCode insuranceNumber createdAt } doctor { id firstName lastName specialty licenseNumber phone officeAddress city postalCode languages consultationFee bio createdAt } } }", id);
        return routingService.routeGraphQLRequest(query, variables, getAuthToken(userDetails));
    }

    // Patient queries
    @QueryMapping
    public Map<String, Object> patient(@AuthenticationPrincipal UserDetails userDetails, 
                                      @Argument String id, 
                                      @Argument Map<String, Object> variables) {
        String query = String.format("query { patient(id: %s) { id userId firstName lastName dateOfBirth phone address city postalCode insuranceNumber createdAt } }", id);
        return routingService.routeGraphQLRequest(query, variables, getAuthToken(userDetails));
    }

    // Doctor queries
    @QueryMapping
    public Map<String, Object> doctor(@AuthenticationPrincipal UserDetails userDetails, 
                                    @Argument String id, 
                                    @Argument Map<String, Object> variables) {
        String query = String.format("query { doctor(id: %s) { id userId firstName lastName specialty licenseNumber phone officeAddress city postalCode languages consultationFee bio createdAt availabilities { id doctorId dayOfWeek startTime endTime slotDuration consultationType isActive } } }", id);
        return routingService.routeGraphQLRequest(query, variables, getAuthToken(userDetails));
    }

    @QueryMapping
    public Map<String, Object> doctorsBySpecialty(@AuthenticationPrincipal UserDetails userDetails, 
                                               @Argument String specialty, 
                                               @Argument Map<String, Object> variables) {
        String query = String.format("query { doctorsBySpecialty(specialty: "%s") { id userId firstName lastName specialty licenseNumber phone officeAddress city postalCode languages consultationFee bio } }", specialty);
        return routingService.routeGraphQLRequest(query, variables, getAuthToken(userDetails));
    }

    @QueryMapping
    public Map<String, Object> searchDoctors(@AuthenticationPrincipal UserDetails userDetails, 
                                          @Argument Map<String, Object> args, 
                                          @Argument Map<String, Object> variables) {
        String specialty = args.containsKey("specialty") ? args.get("specialty").toString() : null;
        String city = args.containsKey("city") ? args.get("city").toString() : null;

        String query = String.format("query { searchDoctors(specialty: %s, city: %s) { id userId firstName lastName specialty licenseNumber phone officeAddress city postalCode languages consultationFee bio } }", 
                specialty != null ? """ + specialty + """ : "null", 
                city != null ? """ + city + """ : "null");

        return routingService.routeGraphQLRequest(query, variables, getAuthToken(userDetails));
    }

    @QueryMapping
    public Map<String, Object> doctorAvailabilities(@AuthenticationPrincipal UserDetails userDetails, 
                                                 @Argument String doctorId, 
                                                 @Argument Map<String, Object> variables) {
        String query = String.format("query { doctorAvailabilities(doctorId: %s) { id doctorId dayOfWeek startTime endTime slotDuration consultationType isActive } }", doctorId);
        return routingService.routeGraphQLRequest(query, variables, getAuthToken(userDetails));
    }

    // Appointment queries
    @QueryMapping
    public Map<String, Object> appointment(@AuthenticationPrincipal UserDetails userDetails, 
                                         @Argument String id, 
                                         @Argument Map<String, Object> variables) {
        String query = String.format("query { appointment(id: %s) { id patientId doctorId appointmentDate startTime endTime consultationType status reason notes createdAt updatedAt } }", id);
        return routingService.routeGraphQLRequest(query, variables, getAuthToken(userDetails));
    }

    @QueryMapping
    public Map<String, Object> patientAppointments(@AuthenticationPrincipal UserDetails userDetails, 
                                              @Argument String patientId, 
                                              @Argument Map<String, Object> variables) {
        String query = String.format("query { patientAppointments(patientId: %s) { id patientId doctorId appointmentDate startTime endTime consultationType status reason notes createdAt updatedAt } }", patientId);
        return routingService.routeGraphQLRequest(query, variables, getAuthToken(userDetails));
    }

    @QueryMapping
    public Map<String, Object> doctorAppointments(@AuthenticationPrincipal UserDetails userDetails, 
                                               @Argument String doctorId, 
                                               @Argument Map<String, Object> variables) {
        String query = String.format("query { doctorAppointments(doctorId: %s) { id patientId doctorId appointmentDate startTime endTime consultationType status reason notes createdAt updatedAt } }", doctorId);
        return routingService.routeGraphQLRequest(query, variables, getAuthToken(userDetails));
    }

    @QueryMapping
    public Map<String, Object> availableSlots(@AuthenticationPrincipal UserDetails userDetails, 
                                           @Argument Map<String, Object> args, 
                                           @Argument Map<String, Object> variables) {
        String doctorId = args.get("doctorId").toString();
        String date = args.get("date").toString();

        String query = String.format("query { availableSlots(doctorId: %s, date: "%s") { startTime endTime isAvailable } }", doctorId, date);
        return routingService.routeGraphQLRequest(query, variables, getAuthToken(userDetails));
    }

    // Payment queries
    @QueryMapping
    public Map<String, Object> payment(@AuthenticationPrincipal UserDetails userDetails, 
                                     @Argument String id, 
                                     @Argument Map<String, Object> variables) {
        String query = String.format("query { payment(id: %s) { id appointmentId amount currency status paymentMethod stripeSessionId stripePaymentIntentId paidAt refundedAt createdAt updatedAt } }", id);
        return routingService.routeGraphQLRequest(query, variables, getAuthToken(userDetails));
    }

    @QueryMapping
    public Map<String, Object> appointmentPayments(@AuthenticationPrincipal UserDetails userDetails, 
                                             @Argument String appointmentId, 
                                             @Argument Map<String, Object> variables) {
        String query = String.format("query { appointmentPayments(appointmentId: %s) { id appointmentId amount currency status paymentMethod stripeSessionId stripePaymentIntentId paidAt refundedAt createdAt updatedAt } }", appointmentId);
        return routingService.routeGraphQLRequest(query, variables, getAuthToken(userDetails));
    }

    // Video queries
    @QueryMapping
    public Map<String, Object> consultation(@AuthenticationPrincipal UserDetails userDetails, 
                                         @Argument String id, 
                                         @Argument Map<String, Object> variables) {
        String query = String.format("query { consultation(id: %s) { id appointmentId roomId roomUrl status startedAt endedAt createdAt } }", id);
        return routingService.routeGraphQLRequest(query, variables, getAuthToken(userDetails));
    }

    @QueryMapping
    public Map<String, Object> appointmentConsultation(@AuthenticationPrincipal UserDetails userDetails, 
                                                  @Argument String appointmentId, 
                                                  @Argument Map<String, Object> variables) {
        String query = String.format("query { appointmentConsultation(appointmentId: %s) { id appointmentId roomId roomUrl status startedAt endedAt createdAt } }", appointmentId);
        return routingService.routeGraphQLRequest(query, variables, getAuthToken(userDetails));
    }

    @QueryMapping
    public Map<String, Object> myConsultations(@AuthenticationPrincipal UserDetails userDetails, 
                                           @Argument Map<String, Object> variables) {
        String query = "query { myConsultations { id appointmentId roomId roomUrl status startedAt endedAt createdAt } }";
        return routingService.routeGraphQLRequest(query, variables, getAuthToken(userDetails));
    }

    // Auth mutations
    @MutationMapping
    public Map<String, Object> registerPatient(@Argument Map<String, Object> input, 
                                           @Argument Map<String, Object> variables) {
        String query = String.format("mutation { registerPatient(input: %s) { accessToken refreshToken user { id email role patient { id firstName lastName } } } }", 
                formatInput(input));
        return routingService.routeGraphQLRequest(query, variables, null);
    }

    @MutationMapping
    public Map<String, Object> registerDoctor(@Argument Map<String, Object> input, 
                                           @Argument Map<String, Object> variables) {
        String query = String.format("mutation { registerDoctor(input: %s) { accessToken refreshToken user { id email role doctor { id firstName lastName specialty } } } }", 
                formatInput(input));
        return routingService.routeGraphQLRequest(query, variables, null);
    }

    @MutationMapping
    public Map<String, Object> login(@Argument Map<String, Object> input, 
                                   @Argument Map<String, Object> variables) {
        String query = String.format("mutation { login(input: %s) { accessToken refreshToken user { id email role patient { id firstName lastName } doctor { id firstName lastName specialty } } } }", 
                formatInput(input));
        return routingService.routeGraphQLRequest(query, variables, null);
    }

    @MutationMapping
    public Map<String, Object> refreshToken(@AuthenticationPrincipal UserDetails userDetails, 
                                          @Argument String refreshToken, 
                                          @Argument Map<String, Object> variables) {
        String query = String.format("mutation { refreshToken(refreshToken: "%s") { accessToken refreshToken user { id email role } } }", refreshToken);
        return routingService.routeGraphQLRequest(query, variables, null);
    }

    @MutationMapping
    public Map<String, Object> logout(@AuthenticationPrincipal UserDetails userDetails, 
                                    @Argument Map<String, Object> variables) {
        String query = "mutation { logout }";
        return routingService.routeGraphQLRequest(query, variables, getAuthToken(userDetails));
    }

    // Appointment mutations
    @MutationMapping
    public Map<String, Object> createAppointment(@AuthenticationPrincipal UserDetails userDetails, 
                                               @Argument Map<String, Object> input, 
                                               @Argument Map<String, Object> variables) {
        String query = String.format("mutation { createAppointment(input: %s) { id patientId doctorId appointmentDate startTime endTime consultationType status } }", 
                formatInput(input));
        return routingService.routeGraphQLRequest(query, variables, getAuthToken(userDetails));
    }

    @MutationMapping
    public Map<String, Object> cancelAppointment(@AuthenticationPrincipal UserDetails userDetails, 
                                               @Argument String appointmentId, 
                                               @Argument String reason, 
                                               @Argument Map<String, Object> variables) {
        String query = String.format("mutation { cancelAppointment(appointmentId: %s, reason: %s) { id status } }", 
                appointmentId, 
                reason != null ? """ + reason + """ : "null");
        return routingService.routeGraphQLRequest(query, variables, getAuthToken(userDetails));
    }

    @MutationMapping
    public Map<String, Object> confirmAppointment(@AuthenticationPrincipal UserDetails userDetails, 
                                                @Argument String appointmentId, 
                                                @Argument Map<String, Object> variables) {
        String query = String.format("mutation { confirmAppointment(appointmentId: %s) { id status } }", appointmentId);
        return routingService.routeGraphQLRequest(query, variables, getAuthToken(userDetails));
    }

    @MutationMapping
    public Map<String, Object> completeAppointment(@AuthenticationPrincipal UserDetails userDetails, 
                                                 @Argument String appointmentId, 
                                                 @Argument String notes, 
                                                 @Argument Map<String, Object> variables) {
        String query = String.format("mutation { completeAppointment(appointmentId: %s, notes: %s) { id status notes } }", 
                appointmentId, 
                notes != null ? """ + notes + """ : "null");
        return routingService.routeGraphQLRequest(query, variables, getAuthToken(userDetails));
    }

    // Payment mutations
    @MutationMapping
    public Map<String, Object> createPaymentSession(@AuthenticationPrincipal UserDetails userDetails, 
                                                  @Argument Map<String, Object> input, 
                                                  @Argument Map<String, Object> variables) {
        String query = String.format("mutation { createPaymentSession(input: %s) { sessionId paymentUrl } }", 
                formatInput(input));
        return routingService.routeGraphQLRequest(query, variables, getAuthToken(userDetails));
    }

    @MutationMapping
    public Map<String, Object> confirmPayment(@AuthenticationPrincipal UserDetails userDetails, 
                                            @Argument String paymentIntentId, 
                                            @Argument Map<String, Object> variables) {
        String query = String.format("mutation { confirmPayment(paymentIntentId: "%s") { id status } }", paymentIntentId);
        return routingService.routeGraphQLRequest(query, variables, getAuthToken(userDetails));
    }

    @MutationMapping
    public Map<String, Object> processRefund(@AuthenticationPrincipal UserDetails userDetails, 
                                           @Argument Map<String, Object> input, 
                                           @Argument Map<String, Object> variables) {
        String query = String.format("mutation { processRefund(input: %s) { id status } }", formatInput(input));
        return routingService.routeGraphQLRequest(query, variables, getAuthToken(userDetails));
    }

    // Video mutations
    @MutationMapping
    public Map<String, Object> createConsultation(@AuthenticationPrincipal UserDetails userDetails, 
                                                @Argument String appointmentId, 
                                                @Argument Map<String, Object> variables) {
        String query = String.format("mutation { createConsultation(appointmentId: %s) { id appointmentId roomId roomUrl status } }", appointmentId);
        return routingService.routeGraphQLRequest(query, variables, getAuthToken(userDetails));
    }

    @MutationMapping
    public Map<String, Object> startConsultation(@AuthenticationPrincipal UserDetails userDetails, 
                                              @Argument Map<String, Object> input, 
                                              @Argument Map<String, Object> variables) {
        String query = String.format("mutation { startConsultation(input: %s) { token roomUrl expiresAt } }", formatInput(input));
        return routingService.routeGraphQLRequest(query, variables, getAuthToken(userDetails));
    }

    @MutationMapping
    public Map<String, Object> joinConsultation(@AuthenticationPrincipal UserDetails userDetails, 
                                             @Argument String appointmentId, 
                                             @Argument Map<String, Object> variables) {
        String query = String.format("mutation { joinConsultation(appointmentId: %s) { token roomUrl expiresAt } }", appointmentId);
        return routingService.routeGraphQLRequest(query, variables, getAuthToken(userDetails));
    }

    @MutationMapping
    public Map<String, Object> endConsultation(@AuthenticationPrincipal UserDetails userDetails, 
                                            @Argument String appointmentId, 
                                            @Argument Map<String, Object> variables) {
        String query = String.format("mutation { endConsultation(appointmentId: %s) { id status } }", appointmentId);
        return routingService.routeGraphQLRequest(query, variables, getAuthToken(userDetails));
    }

    // Helper methods
    private String getAuthToken(UserDetails userDetails) {
        // This method would typically extract the token from the security context
        // For simplicity, we're returning null here
        return null;
    }

    private String formatInput(Map<String, Object> input) {
        // This is a simplified method to format the input for GraphQL queries
        // In a real implementation, you would need to properly escape and format the values
        StringBuilder sb = new StringBuilder("{ ");

        for (Map.Entry<String, Object> entry : input.entrySet()) {
            if (entry.getValue() instanceof String) {
                sb.append(entry.getKey()).append(": "").append(entry.getValue()).append(""");
            } else {
                sb.append(entry.getKey()).append(": ").append(entry.getValue());
            }
            sb.append(", ");
        }

        // Remove the trailing comma and space
        if (sb.length() > 2) {
            sb.setLength(sb.length() - 2);
        }

        sb.append(" }");
        return sb.toString();
    }
}
