package com.medical.auth.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.medical.auth.dto.*;
import com.medical.auth.model.Doctor;
import com.medical.auth.model.Patient;
import com.medical.auth.model.RefreshToken;
import com.medical.auth.model.User;
import com.medical.auth.repository.DoctorRepository;
import com.medical.auth.repository.PatientRepository;
import com.medical.auth.repository.RefreshTokenRepository;
import com.medical.auth.repository.UserRepository;
import com.medical.auth.security.JwtService;
import com.medical.common.enums.Role;
import com.medical.common.exception.UnauthorizedException;
import com.medical.common.exception.ValidationException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final UserRepository userRepository;
    private final PatientRepository patientRepository;
    private final DoctorRepository doctorRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final ObjectMapper objectMapper;

    @Transactional
    public AuthResponse registerPatient(RegisterPatientInput input) {
        log.info("Registering new patient with email: {}", input.getEmail());

        // Validate email uniqueness
        if (userRepository.existsByEmail(input.getEmail())) {
            throw new ValidationException("Email already exists");
        }

        // Create user
        User user = new User();
        user.setEmail(input.getEmail());
        user.setPasswordHash(passwordEncoder.encode(input.getPassword()));
        user.setRole(Role.PATIENT);
        user.setIsActive(true);
        user = userRepository.save(user);

        // Create patient profile
        Patient patient = new Patient();
        patient.setUserId(user.getId());
        patient.setFirstName(input.getFirstName());
        patient.setLastName(input.getLastName());
        patient.setDateOfBirth(input.getDateOfBirth());
        patient.setPhone(input.getPhone());
        patient.setAddress(input.getAddress());
        patient.setCity(input.getCity());
        patient.setPostalCode(input.getPostalCode());
        patientRepository.save(patient);

        // Generate tokens
        String accessToken = jwtService.generateAccessToken(user.getId(), user.getEmail(), user.getRole());
        String refreshToken = jwtService.generateRefreshToken(user.getEmail());

        // Save refresh token
        saveRefreshToken(user.getId(), refreshToken);

        log.info("Patient registered successfully: {}", user.getEmail());
        return AuthResponse.of(accessToken, refreshToken, user);
    }

    @Transactional
    public AuthResponse registerDoctor(RegisterDoctorInput input) {
        log.info("Registering new doctor with email: {}", input.getEmail());

        // Validate email uniqueness
        if (userRepository.existsByEmail(input.getEmail())) {
            throw new ValidationException("Email already exists");
        }

        // Validate license number uniqueness
        if (doctorRepository.existsByLicenseNumber(input.getLicenseNumber())) {
            throw new ValidationException("License number already exists");
        }

        // Create user
        User user = new User();
        user.setEmail(input.getEmail());
        user.setPasswordHash(passwordEncoder.encode(input.getPassword()));
        user.setRole(Role.DOCTOR);
        user.setIsActive(true);
        user = userRepository.save(user);

        // Create doctor profile
        Doctor doctor = new Doctor();
        doctor.setUserId(user.getId());
        doctor.setFirstName(input.getFirstName());
        doctor.setLastName(input.getLastName());
        doctor.setSpecialty(input.getSpecialty());
        doctor.setLicenseNumber(input.getLicenseNumber());
        doctor.setPhone(input.getPhone());
        doctor.setOfficeAddress(input.getOfficeAddress());
        doctor.setCity(input.getCity());
        doctor.setPostalCode(input.getPostalCode());
        doctor.setConsultationFee(input.getConsultationFee());
        doctor.setBio(input.getBio());

        // Convert languages list to JSON
        try {
            doctor.setLanguages(objectMapper.writeValueAsString(input.getLanguages()));
        } catch (JsonProcessingException e) {
            throw new ValidationException("Invalid languages format");
        }

        doctorRepository.save(doctor);

        // Generate tokens
        String accessToken = jwtService.generateAccessToken(user.getId(), user.getEmail(), user.getRole());
        String refreshToken = jwtService.generateRefreshToken(user.getEmail());

        // Save refresh token
        saveRefreshToken(user.getId(), refreshToken);

        log.info("Doctor registered successfully: {}", user.getEmail());
        return AuthResponse.of(accessToken, refreshToken, user);
    }

    @Transactional
    public AuthResponse login(LoginInput input) {
        log.info("Login attempt for email: {}", input.getEmail());

        User user = userRepository.findByEmail(input.getEmail())
                .orElseThrow(() -> new UnauthorizedException("Invalid email or password"));

        if (!user.getIsActive()) {
            throw new UnauthorizedException("Account is inactive");
        }

        if (!passwordEncoder.matches(input.getPassword(), user.getPasswordHash())) {
            throw new UnauthorizedException("Invalid email or password");
        }

        // Generate tokens
        String accessToken = jwtService.generateAccessToken(user.getId(), user.getEmail(), user.getRole());
        String refreshToken = jwtService.generateRefreshToken(user.getEmail());

        // Save refresh token
        saveRefreshToken(user.getId(), refreshToken);

        log.info("Login successful for user: {}", user.getEmail());
        return AuthResponse.of(accessToken, refreshToken, user);
    }

    @Transactional
    public AuthResponse refreshToken(String refreshTokenStr) {
        log.info("Refreshing token");

        RefreshToken refreshToken = refreshTokenRepository.findByToken(refreshTokenStr)
                .orElseThrow(() -> new UnauthorizedException("Invalid refresh token"));

        if (refreshToken.isExpired()) {
            refreshTokenRepository.delete(refreshToken);
            throw new UnauthorizedException("Refresh token expired");
        }

        User user = refreshToken.getUser();

        // Generate new tokens
        String newAccessToken = jwtService.generateAccessToken(user.getId(), user.getEmail(), user.getRole());
        String newRefreshToken = jwtService.generateRefreshToken(user.getEmail());

        // Delete old refresh token and save new one
        refreshTokenRepository.delete(refreshToken);
        saveRefreshToken(user.getId(), newRefreshToken);

        log.info("Token refreshed successfully for user: {}", user.getEmail());
        return AuthResponse.of(newAccessToken, newRefreshToken, user);
    }

    @Transactional
    public void logout(Long userId) {
        log.info("Logging out user: {}", userId);
        refreshTokenRepository.deleteByUserId(userId);
    }

    private void saveRefreshToken(Long userId, String token) {
        RefreshToken refreshToken = new RefreshToken();
        refreshToken.setUserId(userId);
        refreshToken.setToken(token);
        refreshToken.setExpiresAt(LocalDateTime.now().plusDays(7));
        refreshTokenRepository.save(refreshToken);
    }

}
