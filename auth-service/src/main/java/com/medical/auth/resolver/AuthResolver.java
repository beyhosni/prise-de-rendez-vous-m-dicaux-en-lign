package com.medical.auth.resolver;

import com.medical.auth.dto.*;
import com.medical.auth.model.User;
import com.medical.auth.repository.DoctorRepository;
import com.medical.auth.repository.PatientRepository;
import com.medical.auth.repository.UserRepository;
import com.medical.auth.service.AuthService;
import com.medical.common.exception.NotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.MutationMapping;
import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Controller;

@Controller
@RequiredArgsConstructor
@Slf4j
public class AuthResolver {

    private final AuthService authService;
    private final UserRepository userRepository;
    private final PatientRepository patientRepository;
    private final DoctorRepository doctorRepository;

    // Queries
    @QueryMapping
    public UserDTO me() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();
        
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new NotFoundException("User not found"));
        
        UserDTO userDTO = UserDTO.fromEntity(user);
        
        // Load patient or doctor profile
        switch (user.getRole()) {
            case PATIENT:
                patientRepository.findByUserId(user.getId())
                        .ifPresent(patient -> userDTO.setPatient(PatientDTO.fromEntity(patient)));
                break;
            case DOCTOR:
                doctorRepository.findByUserId(user.getId())
                        .ifPresent(doctor -> userDTO.setDoctor(DoctorDTO.fromEntity(doctor)));
                break;
        }
        
        return userDTO;
    }

    @QueryMapping
    public UserDTO user(@Argument Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("User not found"));
        
        UserDTO userDTO = UserDTO.fromEntity(user);
        
        // Load patient or doctor profile
        switch (user.getRole()) {
            case PATIENT:
                patientRepository.findByUserId(user.getId())
                        .ifPresent(patient -> userDTO.setPatient(PatientDTO.fromEntity(patient)));
                break;
            case DOCTOR:
                doctorRepository.findByUserId(user.getId())
                        .ifPresent(doctor -> userDTO.setDoctor(DoctorDTO.fromEntity(doctor)));
                break;
        }
        
        return userDTO;
    }

    // Mutations
    @MutationMapping
    public AuthResponse registerPatient(@Argument RegisterPatientInput input) {
        return authService.registerPatient(input);
    }

    @MutationMapping
    public AuthResponse registerDoctor(@Argument RegisterDoctorInput input) {
        return authService.registerDoctor(input);
    }

    @MutationMapping
    public AuthResponse login(@Argument LoginInput input) {
        return authService.login(input);
    }

    @MutationMapping
    public AuthResponse refreshToken(@Argument String refreshToken) {
        return authService.refreshToken(refreshToken);
    }

    @MutationMapping
    public Boolean logout() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();
        
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new NotFoundException("User not found"));
        
        authService.logout(user.getId());
        return true;
    }

}
