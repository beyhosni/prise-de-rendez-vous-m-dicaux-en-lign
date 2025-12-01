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
import com.medical.common.enums.ConsultationType;
import com.medical.common.exception.ValidationException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Collections;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AppointmentServiceTest {

    @Mock
    private AppointmentRepository appointmentRepository;
    @Mock
    private PatientRepository patientRepository;
    @Mock
    private AvailabilityRepository availabilityRepository;

    @InjectMocks
    private AppointmentService appointmentService;

    private Patient patient;
    private CreateAppointmentInput input;
    private Availability availability;
    private Appointment appointment;

    @BeforeEach
    void setUp() {
        patient = new Patient();
        patient.setId(1L);
        patient.setUserId(100L);

        input = new CreateAppointmentInput();
        input.setDoctorId(2L);
        input.setAppointmentDate(LocalDate.now().plusDays(1));
        input.setStartTime(LocalTime.of(10, 0));
        input.setConsultationType(ConsultationType.IN_PERSON);
        input.setReason("Checkup");

        availability = new Availability();
        availability.setDoctorId(2L);
        availability.setDayOfWeek(input.getAppointmentDate().getDayOfWeek().getValue() % 7);
        availability.setStartTime(LocalTime.of(9, 0));
        availability.setEndTime(LocalTime.of(17, 0));
        availability.setSlotDuration(30);
        availability.setConsultationType(ConsultationType.BOTH);
        availability.setIsActive(true);

        appointment = new Appointment();
        appointment.setId(1L);
        appointment.setPatientId(1L);
        appointment.setDoctorId(2L);
        appointment.setStatus(AppointmentStatus.PENDING);
    }

    @Test
    void createAppointment_Success() {
        when(patientRepository.findByUserId(100L)).thenReturn(Optional.of(patient));
        when(availabilityRepository.findByDoctorIdAndDayOfWeek(any(), any())).thenReturn(Collections.singletonList(availability));
        when(appointmentRepository.findActiveByDoctorAndDate(any(), any())).thenReturn(Collections.emptyList());
        when(appointmentRepository.save(any(Appointment.class))).thenReturn(appointment);

        AppointmentDTO result = appointmentService.createAppointment(100L, input);

        assertNotNull(result);
        verify(appointmentRepository).save(any(Appointment.class));
    }

    @Test
    void createAppointment_SlotNotAvailable() {
        when(patientRepository.findByUserId(100L)).thenReturn(Optional.of(patient));
        when(availabilityRepository.findByDoctorIdAndDayOfWeek(any(), any())).thenReturn(Collections.emptyList()); // No availability

        assertThrows(ValidationException.class, () -> appointmentService.createAppointment(100L, input));
    }

    @Test
    void createAppointment_Collision() {
        when(patientRepository.findByUserId(100L)).thenReturn(Optional.of(patient));
        when(availabilityRepository.findByDoctorIdAndDayOfWeek(any(), any())).thenReturn(Collections.singletonList(availability));
        
        Appointment existing = new Appointment();
        existing.setStartTime(LocalTime.of(10, 0));
        existing.setEndTime(LocalTime.of(10, 30));
        
        when(appointmentRepository.findActiveByDoctorAndDate(any(), any())).thenReturn(Collections.singletonList(existing));

        assertThrows(ValidationException.class, () -> appointmentService.createAppointment(100L, input));
    }

    @Test
    void cancelAppointment_Success() {
        when(appointmentRepository.findById(1L)).thenReturn(Optional.of(appointment));
        when(patientRepository.findByUserId(100L)).thenReturn(Optional.of(patient));
        when(appointmentRepository.save(any(Appointment.class))).thenReturn(appointment);

        AppointmentDTO result = appointmentService.cancelAppointment(100L, 1L, "Reason");

        assertNotNull(result);
        assertEquals(AppointmentStatus.CANCELLED_BY_PATIENT, appointment.getStatus());
    }

    @Test
    void cancelAppointment_NotAuthorized() {
        Patient otherPatient = new Patient();
        otherPatient.setId(2L);
        otherPatient.setUserId(200L);

        when(appointmentRepository.findById(1L)).thenReturn(Optional.of(appointment)); // Owned by patient 1
        when(patientRepository.findByUserId(200L)).thenReturn(Optional.of(otherPatient));

        assertThrows(ValidationException.class, () -> appointmentService.cancelAppointment(200L, 1L, "Reason"));
    }
}
