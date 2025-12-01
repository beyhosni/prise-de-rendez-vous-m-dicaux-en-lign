package com.medical.patient.service;

import com.medical.common.exception.NotFoundException;
import com.medical.patient.dto.PatientDTO;
import com.medical.patient.dto.UpdatePatientProfileInput;
import com.medical.patient.model.Patient;
import com.medical.patient.repository.PatientRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class PatientService {

    private final PatientRepository patientRepository;

    public PatientDTO getPatientById(Long id) {
        Patient patient = patientRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Patient not found"));
        return PatientDTO.fromEntity(patient);
    }

    public PatientDTO getPatientByUserId(Long userId) {
        Patient patient = patientRepository.findByUserId(userId)
                .orElseThrow(() -> new NotFoundException("Patient profile not found"));
        return PatientDTO.fromEntity(patient);
    }

    @Transactional
    public PatientDTO updateProfile(Long userId, UpdatePatientProfileInput input) {
        Patient patient = patientRepository.findByUserId(userId)
                .orElseThrow(() -> new NotFoundException("Patient profile not found"));

        if (input.getFirstName() != null) patient.setFirstName(input.getFirstName());
        if (input.getLastName() != null) patient.setLastName(input.getLastName());
        if (input.getDateOfBirth() != null) patient.setDateOfBirth(input.getDateOfBirth());
        if (input.getPhone() != null) patient.setPhone(input.getPhone());
        if (input.getAddress() != null) patient.setAddress(input.getAddress());
        if (input.getCity() != null) patient.setCity(input.getCity());
        if (input.getPostalCode() != null) patient.setPostalCode(input.getPostalCode());
        if (input.getInsuranceNumber() != null) patient.setInsuranceNumber(input.getInsuranceNumber());

        patient = patientRepository.save(patient);
        return PatientDTO.fromEntity(patient);
    }

}
