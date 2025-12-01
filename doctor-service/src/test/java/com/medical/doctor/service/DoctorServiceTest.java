package com.medical.doctor.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.medical.common.enums.ConsultationType;
import com.medical.common.exception.NotFoundException;
import com.medical.common.exception.ValidationException;
import com.medical.doctor.dto.AvailabilityDTO;
import com.medical.doctor.dto.CreateAvailabilityInput;
import com.medical.doctor.dto.DoctorDTO;
import com.medical.doctor.dto.UpdateDoctorProfileInput;
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

import java.math.BigDecimal;
import java.time.LocalTime;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DoctorServiceTest {

    @Mock
    private DoctorRepository doctorRepository;
    @Mock
    private AvailabilityRepository availabilityRepository;
    @Mock
    private ObjectMapper objectMapper;

    @InjectMocks
    private DoctorService doctorService;

    @InjectMocks
    private AvailabilityService availabilityService;

    private Doctor doctor;
    private UpdateDoctorProfileInput updateInput;
    private CreateAvailabilityInput availabilityInput;

    @BeforeEach
    void setUp() {
        doctor = new Doctor();
        doctor.setId(1L);
        doctor.setUserId(100L);
        doctor.setFirstName("John");
        doctor.setLastName("Doe");
        doctor.setSpecialty("Cardiology");
        doctor.setLanguages("[\"English\"]");

        updateInput = new UpdateDoctorProfileInput();
        updateInput.setBio("New Bio");
        updateInput.setConsultationFee(new BigDecimal("150.0"));

        availabilityInput = new CreateAvailabilityInput();
        availabilityInput.setDayOfWeek(1);
        availabilityInput.setStartTime(LocalTime.of(9, 0));
        availabilityInput.setEndTime(LocalTime.of(17, 0));
        availabilityInput.setSlotDuration(30);
        availabilityInput.setConsultationType(ConsultationType.IN_PERSON);
    }

    // DoctorService Tests

    @Test
    void updateProfile_Success() {
        when(doctorRepository.findByUserId(100L)).thenReturn(Optional.of(doctor));
        when(doctorRepository.save(any(Doctor.class))).thenReturn(doctor);

        DoctorDTO result = doctorService.updateProfile(100L, updateInput);

        assertNotNull(result);
        assertEquals("New Bio", doctor.getBio());
        assertEquals(new BigDecimal("150.0"), doctor.getConsultationFee());
        verify(doctorRepository).save(doctor);
    }

    @Test
    void updateProfile_NotFound() {
        when(doctorRepository.findByUserId(999L)).thenReturn(Optional.empty());

        assertThrows(NotFoundException.class, () -> doctorService.updateProfile(999L, updateInput));
    }

    @Test
    void searchDoctors_Success() {
        when(doctorRepository.searchDoctors("Cardiology", "Paris"))
                .thenReturn(Collections.singletonList(doctor));

        List<DoctorDTO> result = doctorService.searchDoctors("Cardiology", "Paris");

        assertFalse(result.isEmpty());
        assertEquals(1, result.size());
        assertEquals("Cardiology", result.get(0).getSpecialty());
    }

    // AvailabilityService Tests (I'll put them here or separate class, let's separate for clarity but keep in same file write for speed if allowed, but better separate)
}
