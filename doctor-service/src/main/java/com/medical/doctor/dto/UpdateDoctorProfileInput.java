package com.medical.doctor.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.util.List;

@Data
public class UpdateDoctorProfileInput {

    private String phone;
    private String officeAddress;
    private String city;
    private String postalCode;
    private List<String> languages;
    private BigDecimal consultationFee;
    private String bio;

}
