package com.medical.appointment.controller;

import com.medical.appointment.dto.AppointmentDTO;
import com.medical.appointment.dto.CreateAppointmentInput;
import com.medical.appointment.dto.TimeSlot;
import com.medical.appointment.service.AppointmentService;
import com.medical.appointment.service.SlotService;
import com.medical.common.exception.UnauthorizedException;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/appointments")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class AppointmentController {

    private final AppointmentService appointmentService;
    private final SlotService slotService;

    @GetMapping("/{id}")
    public ResponseEntity<AppointmentDTO> getAppointment(@PathVariable Long id) {
        return ResponseEntity.ok(appointmentService.getAppointmentById(id));
    }

    @GetMapping("/patient/{patientId}")
    public ResponseEntity<List<AppointmentDTO>> getPatientAppointments(@PathVariable Long patientId) {
        return ResponseEntity.ok(appointmentService.getAppointmentsByPatient(patientId));
    }

    @GetMapping("/doctor/{doctorId}")
    public ResponseEntity<List<AppointmentDTO>> getDoctorAppointments(@PathVariable Long doctorId) {
        return ResponseEntity.ok(appointmentService.getAppointmentsByDoctor(doctorId));
    }

    @GetMapping("/slots")
    public ResponseEntity<List<TimeSlot>> getAvailableSlots(
            @RequestParam Long doctorId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return ResponseEntity.ok(slotService.getAvailableSlots(doctorId, date));
    }

    @PostMapping
    public ResponseEntity<AppointmentDTO> createAppointment(@Valid @RequestBody CreateAppointmentInput input) {
        Long userId = getAuthenticatedUserId();
        return ResponseEntity.ok(appointmentService.createAppointment(userId, input));
    }

    @PutMapping("/{appointmentId}/cancel")
    public ResponseEntity<AppointmentDTO> cancelAppointment(
            @PathVariable Long appointmentId,
            @RequestParam(required = false) String reason) {
        Long userId = getAuthenticatedUserId();
        return ResponseEntity.ok(appointmentService.cancelAppointment(userId, appointmentId, reason));
    }

    @PutMapping("/{appointmentId}/confirm")
    public ResponseEntity<AppointmentDTO> confirmAppointment(@PathVariable Long appointmentId) {
        return ResponseEntity.ok(appointmentService.confirmAppointment(appointmentId));
    }

    @PutMapping("/{appointmentId}/complete")
    public ResponseEntity<AppointmentDTO> completeAppointment(
            @PathVariable Long appointmentId,
            @RequestParam(required = false) String notes) {
        return ResponseEntity.ok(appointmentService.completeAppointment(appointmentId, notes));
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
