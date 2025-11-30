package com.medical.appointment.resolver;

import com.medical.appointment.dto.AppointmentDTO;
import com.medical.appointment.dto.CreateAppointmentInput;
import com.medical.appointment.dto.TimeSlot;
import com.medical.appointment.service.AppointmentService;
import com.medical.appointment.service.SlotService;
import com.medical.common.exception.UnauthorizedException;
import graphql.kickstart.tools.GraphQLMutationResolver;
import graphql.kickstart.tools.GraphQLQueryResolver;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.List;

@Component
@RequiredArgsConstructor
public class AppointmentResolver implements GraphQLQueryResolver, GraphQLMutationResolver {

    private final AppointmentService appointmentService;
    private final SlotService slotService;

    // Queries
    public AppointmentDTO appointment(Long id) {
        return appointmentService.getAppointmentById(id);
    }

    public List<AppointmentDTO> patientAppointments(Long patientId) {
        // TODO: Verify authorization (patient can see own, doctor can see own, admin can see all)
        return appointmentService.getAppointmentsByPatient(patientId);
    }

    public List<AppointmentDTO> doctorAppointments(Long doctorId) {
        return appointmentService.getAppointmentsByDoctor(doctorId);
    }

    public List<TimeSlot> availableSlots(Long doctorId, LocalDate date) {
        return slotService.getAvailableSlots(doctorId, date);
    }

    // Mutations
    public AppointmentDTO createAppointment(CreateAppointmentInput input) {
        Long userId = getAuthenticatedUserId();
        return appointmentService.createAppointment(userId, input);
    }

    public AppointmentDTO cancelAppointment(Long appointmentId, String reason) {
        Long userId = getAuthenticatedUserId();
        return appointmentService.cancelAppointment(userId, appointmentId, reason);
    }

    public AppointmentDTO confirmAppointment(Long appointmentId) {
        // TODO: Verify doctor authorization
        return appointmentService.confirmAppointment(appointmentId);
    }

    public AppointmentDTO completeAppointment(Long appointmentId, String notes) {
        // TODO: Verify doctor authorization
        return appointmentService.completeAppointment(appointmentId, notes);
    }

    private Long getAuthenticatedUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new UnauthorizedException("User not authenticated");
        }
        try {
            return (Long) authentication.getPrincipal();
        } catch (Exception e) {
            throw new UnauthorizedException("Invalid user principal");
        }
    }

}
