package com.medical.appointment.resolver;

import com.medical.appointment.dto.AppointmentDTO;
import com.medical.appointment.dto.CreateAppointmentInput;
import com.medical.appointment.dto.TimeSlot;
import com.medical.appointment.service.AppointmentService;
import com.medical.appointment.service.SlotService;
import com.medical.common.exception.UnauthorizedException;
import lombok.RequiredArgsConstructor;
import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.MutationMapping;
import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Controller;

import java.time.LocalDate;
import java.util.List;

@Controller
@RequiredArgsConstructor
public class AppointmentResolver {

    private final AppointmentService appointmentService;
    private final SlotService slotService;

    // Queries
    @QueryMapping
    public AppointmentDTO appointment(@Argument Long id) {
        return appointmentService.getAppointmentById(id);
    }

    @QueryMapping
    public List<AppointmentDTO> patientAppointments(@Argument Long patientId) {
        // TODO: Verify authorization (patient can see own, doctor can see own, admin can see all)
        return appointmentService.getAppointmentsByPatient(patientId);
    }

    @QueryMapping
    public List<AppointmentDTO> doctorAppointments(@Argument Long doctorId) {
        return appointmentService.getAppointmentsByDoctor(doctorId);
    }

    @QueryMapping
    public List<TimeSlot> availableSlots(@Argument Long doctorId, @Argument LocalDate date) {
        return slotService.getAvailableSlots(doctorId, date);
    }

    // Mutations
    @MutationMapping
    public AppointmentDTO createAppointment(@Argument CreateAppointmentInput input) {
        Long userId = getAuthenticatedUserId();
        return appointmentService.createAppointment(userId, input);
    }

    @MutationMapping
    public AppointmentDTO cancelAppointment(@Argument Long appointmentId, @Argument String reason) {
        Long userId = getAuthenticatedUserId();
        return appointmentService.cancelAppointment(userId, appointmentId, reason);
    }

    @MutationMapping
    public AppointmentDTO confirmAppointment(@Argument Long appointmentId) {
        // TODO: Verify doctor authorization
        return appointmentService.confirmAppointment(appointmentId);
    }

    @MutationMapping
    public AppointmentDTO completeAppointment(@Argument Long appointmentId, @Argument String notes) {
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
