package com.medical.auth.dto;

import com.medical.auth.model.Patient;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PatientDTO {

    private Long id;
    private Long userId;
    private String firstName;
    private String lastName;
    private LocalDate dateOfBirth;
    private String phone;
    private String address;
    private String city;
    private String postalCode;
    private String insuranceNumber;
    private LocalDateTime createdAt;

    public static PatientDTO fromEntity(Patient patient) {
        if (patient == null) return null;
        
        PatientDTO dto = new PatientDTO();
        dto.setId(patient.getId());
        dto.setUserId(patient.getUserId());
        dto.setFirstName(patient.getFirstName());
        dto.setLastName(patient.getLastName());
        dto.setDateOfBirth(patient.getDateOfBirth());
        dto.setPhone(patient.getPhone());
        dto.setAddress(patient.getAddress());
        dto.setCity(patient.getCity());
        dto.setPostalCode(patient.getPostalCode());
        dto.setInsuranceNumber(patient.getInsuranceNumber());
        dto.setCreatedAt(patient.getCreatedAt());
        return dto;
    }

}
