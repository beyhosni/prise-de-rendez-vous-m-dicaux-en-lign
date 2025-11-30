package com.medical.auth.resolver;

import com.medical.auth.dto.*;
import com.medical.auth.model.User;
import com.medical.auth.repository.DoctorRepository;
import com.medical.auth.repository.PatientRepository;
import com.medical.auth.repository.UserRepository;
import com.medical.auth.service.AuthService;
import com.medical.common.exception.NotFoundException;
import graphql.kickstart.tools.GraphQLMutationResolver;
import graphql.kickstart.tools.GraphQLQueryResolver;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class AuthResolver implements GraphQLQueryResolver, GraphQLMutationResolver {

    private final AuthService authService;
    private final UserRepository userRepository;
    private final PatientRepository patientRepository;
    private final DoctorRepository doctorRepository;

    // Queries
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

    public UserDTO user(Long id) {
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
    public AuthResponse registerPatient(RegisterPatientInput input) {
        return authService.registerPatient(input);
    }

    public AuthResponse registerDoctor(RegisterDoctorInput input) {
        return authService.registerDoctor(input);
    }

    public AuthResponse login(LoginInput input) {
        return authService.login(input);
    }

    public AuthResponse refreshToken(String refreshToken) {
        return authService.refreshToken(refreshToken);
    }

    public Boolean logout() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();
        
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new NotFoundException("User not found"));
        
        authService.logout(user.getId());
        return true;
    }

}
