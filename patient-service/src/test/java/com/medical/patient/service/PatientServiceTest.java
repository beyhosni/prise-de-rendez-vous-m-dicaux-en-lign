package com.medical.patient.service;

import com.medical.common.exception.NotFoundException;
import com.medical.patient.dto.PatientDTO;
import com.medical.patient.dto.UpdatePatientProfileInput;
import com.medical.patient.model.Patient;
import com.medical.patient.repository.PatientRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PatientServiceTest {

    @Mock
    private PatientRepository patientRepository;

    @InjectMocks
    private PatientService patientService;

    private Patient patient;
    private UpdatePatientProfileInput input;

    @BeforeEach
    void setUp() {
        patient = new Patient();
        patient.setId(1L);
        patient.setUserId(100L);
        patient.setFirstName("John");
        patient.setLastName("Doe");

        input = new UpdatePatientProfileInput();
        input.setFirstName("Jane");
        input.setCity("London");
    }

    @Test
    void updateProfile_Success() {
        when(patientRepository.findByUserId(100L)).thenReturn(Optional.of(patient));
        when(patientRepository.save(any(Patient.class))).thenReturn(patient);

        PatientDTO result = patientService.updateProfile(100L, input);

        assertNotNull(result);
        assertEquals("Jane", patient.getFirstName());
        assertEquals("London", patient.getCity());
        verify(patientRepository).save(patient);
    }

    @Test
    void updateProfile_NotFound() {
        when(patientRepository.findByUserId(999L)).thenReturn(Optional.empty());

        assertThrows(NotFoundException.class, () -> patientService.updateProfile(999L, input));
    }

    @Test
    void getPatientById_Success() {
        when(patientRepository.findById(1L)).thenReturn(Optional.of(patient));

        PatientDTO result = patientService.getPatientById(1L);

        assertNotNull(result);
        assertEquals(1L, result.getId());
    }
}
