package com.medical.auth.controller;

import com.medical.auth.dto.*;
import com.medical.auth.model.User;
import com.medical.auth.repository.DoctorRepository;
import com.medical.auth.repository.PatientRepository;
import com.medical.auth.repository.UserRepository;
import com.medical.auth.service.AuthService;
import com.medical.common.exception.NotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class AuthController {

    private final AuthService authService;
    private final UserRepository userRepository;
    private final PatientRepository patientRepository;
    private final DoctorRepository doctorRepository;

    @PostMapping("/register/patient")
    public ResponseEntity<AuthResponse> registerPatient(@Valid @RequestBody RegisterPatientInput input) {
        return ResponseEntity.ok(authService.registerPatient(input));
    }

    @PostMapping("/register/doctor")
    public ResponseEntity<AuthResponse> registerDoctor(@Valid @RequestBody RegisterDoctorInput input) {
        return ResponseEntity.ok(authService.registerDoctor(input));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginInput input) {
        return ResponseEntity.ok(authService.login(input));
    }

    @PostMapping("/refresh")
    public ResponseEntity<AuthResponse> refreshToken(@RequestBody String refreshToken) {
        return ResponseEntity.ok(authService.refreshToken(refreshToken));
    }

    @PostMapping("/logout")
    public ResponseEntity<Boolean> logout() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();
        
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new NotFoundException("User not found"));
        
        authService.logout(user.getId());
        return ResponseEntity.ok(true);
    }

    @GetMapping("/me")
    public ResponseEntity<UserDTO> me() {
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
        
        return ResponseEntity.ok(userDTO);
    }

    @GetMapping("/user/{id}")
    public ResponseEntity<UserDTO> getUser(@PathVariable Long id) {
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
        
        return ResponseEntity.ok(userDTO);
    }
}
