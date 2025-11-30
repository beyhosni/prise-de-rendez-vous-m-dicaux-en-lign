package com.medical.doctor.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.medical.common.exception.NotFoundException;
import com.medical.doctor.dto.DoctorDTO;
import com.medical.doctor.dto.UpdateDoctorProfileInput;
import com.medical.doctor.model.Doctor;
import com.medical.doctor.repository.DoctorRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DoctorService {

    private final DoctorRepository doctorRepository;
    private final ObjectMapper objectMapper;

    public DoctorDTO getDoctorById(Long id) {
        Doctor doctor = doctorRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Doctor not found"));
        return DoctorDTO.fromEntity(doctor);
    }

    public DoctorDTO getDoctorByUserId(Long userId) {
        Doctor doctor = doctorRepository.findByUserId(userId)
                .orElseThrow(() -> new NotFoundException("Doctor profile not found"));
        return DoctorDTO.fromEntity(doctor);
    }

    public List<DoctorDTO> getAllDoctors() {
        return doctorRepository.findAll().stream()
                .map(DoctorDTO::fromEntity)
                .collect(Collectors.toList());
    }

    public List<DoctorDTO> getDoctorsBySpecialty(String specialty) {
        return doctorRepository.findBySpecialty(specialty).stream()
                .map(DoctorDTO::fromEntity)
                .collect(Collectors.toList());
    }

    public List<DoctorDTO> searchDoctors(String specialty, String city) {
        return doctorRepository.searchDoctors(specialty, city).stream()
                .map(DoctorDTO::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional
    public DoctorDTO updateProfile(Long userId, UpdateDoctorProfileInput input) {
        Doctor doctor = doctorRepository.findByUserId(userId)
                .orElseThrow(() -> new NotFoundException("Doctor profile not found"));

        if (input.getPhone() != null) doctor.setPhone(input.getPhone());
        if (input.getOfficeAddress() != null) doctor.setOfficeAddress(input.getOfficeAddress());
        if (input.getCity() != null) doctor.setCity(input.getCity());
        if (input.getPostalCode() != null) doctor.setPostalCode(input.getPostalCode());
        if (input.getConsultationFee() != null) doctor.setConsultationFee(input.getConsultationFee());
        if (input.getBio() != null) doctor.setBio(input.getBio());

        if (input.getLanguages() != null) {
            try {
                doctor.setLanguages(objectMapper.writeValueAsString(input.getLanguages()));
            } catch (JsonProcessingException e) {
                throw new RuntimeException("Error processing languages", e);
            }
        }

        doctor = doctorRepository.save(doctor);
        return DoctorDTO.fromEntity(doctor);
    }

}
