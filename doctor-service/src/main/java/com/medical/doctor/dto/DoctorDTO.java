package com.medical.doctor.dto;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.medical.doctor.model.Doctor;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DoctorDTO {

    private Long id;
    private Long userId;
    private String firstName;
    private String lastName;
    private String specialty;
    private String licenseNumber;
    private String phone;
    private String officeAddress;
    private String city;
    private String postalCode;
    private List<String> languages;
    private BigDecimal consultationFee;
    private String bio;
    private List<AvailabilityDTO> availabilities;
    private LocalDateTime createdAt;

    public static DoctorDTO fromEntity(Doctor doctor) {
        if (doctor == null) return null;
        
        DoctorDTO dto = new DoctorDTO();
        dto.setId(doctor.getId());
        dto.setUserId(doctor.getUserId());
        dto.setFirstName(doctor.getFirstName());
        dto.setLastName(doctor.getLastName());
        dto.setSpecialty(doctor.getSpecialty());
        dto.setLicenseNumber(doctor.getLicenseNumber());
        dto.setPhone(doctor.getPhone());
        dto.setOfficeAddress(doctor.getOfficeAddress());
        dto.setCity(doctor.getCity());
        dto.setPostalCode(doctor.getPostalCode());
        dto.setConsultationFee(doctor.getConsultationFee());
        dto.setBio(doctor.getBio());
        dto.setCreatedAt(doctor.getCreatedAt());
        
        // Parse JSON languages
        try {
            ObjectMapper mapper = new ObjectMapper();
            dto.setLanguages(mapper.readValue(doctor.getLanguages(), new TypeReference<List<String>>() {}));
        } catch (Exception e) {
            dto.setLanguages(new ArrayList<>());
        }
        
        return dto;
    }

}
