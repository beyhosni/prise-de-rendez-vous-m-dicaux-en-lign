package com.medical.appointment.service;

import com.medical.appointment.dto.AppointmentDTO;
import com.medical.appointment.dto.CreateAppointmentInput;
import com.medical.appointment.model.Appointment;
import com.medical.appointment.model.Availability;
import com.medical.appointment.model.Patient;
import com.medical.appointment.repository.AppointmentRepository;
import com.medical.appointment.repository.AvailabilityRepository;
import com.medical.appointment.repository.PatientRepository;
import com.medical.common.enums.AppointmentStatus;
import com.medical.common.exception.NotFoundException;
import com.medical.common.exception.ValidationException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AppointmentService {

    private final AppointmentRepository appointmentRepository;
    private final PatientRepository patientRepository;
    private final AvailabilityRepository availabilityRepository;

    public AppointmentDTO getAppointmentById(Long id) {
        Appointment appointment = appointmentRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Appointment not found"));
        return AppointmentDTO.fromEntity(appointment);
    }

    public List<AppointmentDTO> getAppointmentsByPatient(Long patientId) {
        return appointmentRepository.findByPatientId(patientId).stream()
                .map(AppointmentDTO::fromEntity)
                .collect(Collectors.toList());
    }

    public List<AppointmentDTO> getAppointmentsByDoctor(Long doctorId) {
        return appointmentRepository.findByDoctorId(doctorId).stream()
                .map(AppointmentDTO::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional
    public AppointmentDTO createAppointment(Long userId, CreateAppointmentInput input) {
        // 1. Find patient
        Patient patient = patientRepository.findByUserId(userId)
                .orElseThrow(() -> new NotFoundException("Patient profile not found"));

        // 2. Check if doctor exists (optional, or rely on FK constraint)
        // We assume doctorId is valid or we catch exception

        // 3. Check availability
        int dayOfWeek = input.getAppointmentDate().getDayOfWeek().getValue() % 7;
        if (dayOfWeek == 7) dayOfWeek = 0;

        List<Availability> availabilities = availabilityRepository.findByDoctorIdAndDayOfWeek(input.getDoctorId(), dayOfWeek);
        
        boolean isSlotValid = false;
        LocalTime endTime = null;

        for (Availability availability : availabilities) {
            if (!availability.getIsActive()) continue;
            
            // Check if time is within range
            if (!input.getStartTime().isBefore(availability.getStartTime()) && 
                input.getStartTime().isBefore(availability.getEndTime())) {
                
                // Check consultation type
                if (availability.getConsultationType() != com.medical.common.enums.ConsultationType.BOTH &&
                    availability.getConsultationType() != input.getConsultationType()) {
                    continue;
                }

                // Calculate end time
                endTime = input.getStartTime().plusMinutes(availability.getSlotDuration());
                
                // Check if end time is valid
                if (endTime.isAfter(availability.getEndTime())) {
                    continue;
                }

                isSlotValid = true;
                break;
            }
        }

        if (!isSlotValid) {
            throw new ValidationException("Selected slot is not available in doctor's schedule");
        }

        // 4. Check collisions
        List<Appointment> existing = appointmentRepository.findActiveByDoctorAndDate(input.getDoctorId(), input.getAppointmentDate());
        for (Appointment appt : existing) {
            if (isOverlapping(input.getStartTime(), endTime, appt.getStartTime(), appt.getEndTime())) {
                throw new ValidationException("Slot is already booked");
            }
        }

        // 5. Create appointment
        Appointment appointment = new Appointment();
        appointment.setPatientId(patient.getId());
        appointment.setDoctorId(input.getDoctorId());
        appointment.setAppointmentDate(input.getAppointmentDate());
        appointment.setStartTime(input.getStartTime());
        appointment.setEndTime(endTime);
        appointment.setConsultationType(input.getConsultationType());
        appointment.setStatus(AppointmentStatus.PENDING);
        appointment.setReason(input.getReason());

        appointment = appointmentRepository.save(appointment);
        return AppointmentDTO.fromEntity(appointment);
    }

    @Transactional
    public AppointmentDTO cancelAppointment(Long userId, Long appointmentId, String reason) {
        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new NotFoundException("Appointment not found"));

        // Verify ownership (patient or doctor)
        // Simplified: check if patient owns it. For doctor, we need to check doctor profile.
        // Assuming this is called by patient for now.
        Patient patient = patientRepository.findByUserId(userId).orElse(null);
        
        if (patient != null && !appointment.getPatientId().equals(patient.getId())) {
             throw new ValidationException("Not authorized to cancel this appointment");
        }
        // TODO: Handle doctor cancellation logic

        appointment.setStatus(AppointmentStatus.CANCELLED_BY_PATIENT);
        appointment.setNotes(reason != null ? "Cancelled: " + reason : "Cancelled by patient");
        
        appointment = appointmentRepository.save(appointment);
        return AppointmentDTO.fromEntity(appointment);
    }

    @Transactional
    public AppointmentDTO confirmAppointment(Long appointmentId) {
        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new NotFoundException("Appointment not found"));

        appointment.setStatus(AppointmentStatus.CONFIRMED);
        appointment = appointmentRepository.save(appointment);
        return AppointmentDTO.fromEntity(appointment);
    }

    @Transactional
    public AppointmentDTO completeAppointment(Long appointmentId, String notes) {
        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new NotFoundException("Appointment not found"));

        appointment.setStatus(AppointmentStatus.COMPLETED);
        if (notes != null) {
            appointment.setNotes(notes);
        }
        appointment = appointmentRepository.save(appointment);
        return AppointmentDTO.fromEntity(appointment);
    }

    private boolean isOverlapping(LocalTime start1, LocalTime end1, LocalTime start2, LocalTime end2) {
        return start1.isBefore(end2) && start2.isBefore(end1);
    }

}
