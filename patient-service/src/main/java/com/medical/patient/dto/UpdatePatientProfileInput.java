package com.medical.patient.dto;

import lombok.Data;
import java.time.LocalDate;

@Data
public class UpdatePatientProfileInput {

    private String firstName;
    private String lastName;
    private LocalDate dateOfBirth;
    private String phone;
    private String address;
    private String city;
    private String postalCode;
    private String insuranceNumber;

}
