package com.medical.doctor.service;

import com.medical.common.enums.ConsultationType;
import com.medical.common.exception.NotFoundException;
import com.medical.common.exception.ValidationException;
import com.medical.doctor.dto.AvailabilityDTO;
import com.medical.doctor.dto.CreateAvailabilityInput;
import com.medical.doctor.model.Availability;
import com.medical.doctor.model.Doctor;
import com.medical.doctor.repository.AvailabilityRepository;
import com.medical.doctor.repository.DoctorRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalTime;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AvailabilityServiceTest {

    @Mock
    private AvailabilityRepository availabilityRepository;
    @Mock
    private DoctorRepository doctorRepository;

    @InjectMocks
    private AvailabilityService availabilityService;

    private Doctor doctor;
    private CreateAvailabilityInput input;
    private Availability availability;

    @BeforeEach
    void setUp() {
        doctor = new Doctor();
        doctor.setId(1L);
        doctor.setUserId(100L);

        input = new CreateAvailabilityInput();
        input.setDayOfWeek(1);
        input.setStartTime(LocalTime.of(9, 0));
        input.setEndTime(LocalTime.of(17, 0));
        input.setSlotDuration(30);
        input.setConsultationType(ConsultationType.IN_PERSON);

        availability = new Availability();
        availability.setId(1L);
        availability.setDoctorId(1L);
        availability.setDayOfWeek(1);
        availability.setStartTime(LocalTime.of(9, 0));
        availability.setEndTime(LocalTime.of(17, 0));
        availability.setSlotDuration(30);
        availability.setConsultationType(ConsultationType.IN_PERSON);
        availability.setIsActive(true);
    }

    @Test
    void createAvailability_Success() {
        when(doctorRepository.findByUserId(100L)).thenReturn(Optional.of(doctor));
        when(availabilityRepository.save(any(Availability.class))).thenReturn(availability);

        AvailabilityDTO result = availabilityService.createAvailability(100L, input);

        assertNotNull(result);
        assertEquals(1L, result.getDoctorId());
        verify(availabilityRepository).save(any(Availability.class));
    }

    @Test
    void createAvailability_InvalidTimeRange() {
        when(doctorRepository.findByUserId(100L)).thenReturn(Optional.of(doctor));
        input.setEndTime(LocalTime.of(8, 0)); // End before start

        assertThrows(ValidationException.class, () -> availabilityService.createAvailability(100L, input));
    }

    @Test
    void deleteAvailability_Success() {
        when(doctorRepository.findByUserId(100L)).thenReturn(Optional.of(doctor));
        when(availabilityRepository.findById(1L)).thenReturn(Optional.of(availability));

        Boolean result = availabilityService.deleteAvailability(100L, 1L);

        assertTrue(result);
        verify(availabilityRepository).delete(availability);
    }

    @Test
    void deleteAvailability_NotAuthorized() {
        Doctor otherDoctor = new Doctor();
        otherDoctor.setId(2L);
        otherDoctor.setUserId(200L);

        when(doctorRepository.findByUserId(200L)).thenReturn(Optional.of(otherDoctor));
        when(availabilityRepository.findById(1L)).thenReturn(Optional.of(availability)); // Owned by doctor 1

        assertThrows(ValidationException.class, () -> availabilityService.deleteAvailability(200L, 1L));
        verify(availabilityRepository, never()).delete(any());
    }
}
