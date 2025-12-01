package com.medical.auth.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.medical.auth.dto.AuthResponse;
import com.medical.auth.dto.LoginInput;
import com.medical.auth.dto.RegisterDoctorInput;
import com.medical.auth.dto.RegisterPatientInput;
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
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;
    @Mock
    private PatientRepository patientRepository;
    @Mock
    private DoctorRepository doctorRepository;
    @Mock
    private RefreshTokenRepository refreshTokenRepository;
    @Mock
    private PasswordEncoder passwordEncoder;
    @Mock
    private JwtService jwtService;
    @Mock
    private ObjectMapper objectMapper;

    @InjectMocks
    private AuthService authService;

    private RegisterPatientInput patientInput;
    private RegisterDoctorInput doctorInput;
    private LoginInput loginInput;
    private User user;

    @BeforeEach
    void setUp() {
        patientInput = new RegisterPatientInput();
        patientInput.setEmail("patient@test.com");
        patientInput.setPassword("password");
        patientInput.setFirstName("John");
        patientInput.setLastName("Doe");
        patientInput.setDateOfBirth(LocalDate.of(1990, 1, 1));

        doctorInput = new RegisterDoctorInput();
        doctorInput.setEmail("doctor@test.com");
        doctorInput.setPassword("password");
        doctorInput.setFirstName("Jane");
        doctorInput.setLastName("Smith");
        doctorInput.setLicenseNumber("LIC123");
        doctorInput.setSpecialty("Cardiology");
        doctorInput.setConsultationFee(new BigDecimal("100.0"));
        doctorInput.setLanguages(Collections.singletonList("English"));

        loginInput = new LoginInput();
        loginInput.setEmail("test@test.com");
        loginInput.setPassword("password");

        user = new User();
        user.setId(1L);
        user.setEmail("test@test.com");
        user.setPasswordHash("encodedPassword");
        user.setRole(Role.PATIENT);
        user.setIsActive(true);
    }

    @Test
    void registerPatient_Success() {
        when(userRepository.existsByEmail(any())).thenReturn(false);
        when(passwordEncoder.encode(any())).thenReturn("encodedPassword");
        when(userRepository.save(any(User.class))).thenReturn(user);
        when(jwtService.generateAccessToken(any(), any(), any())).thenReturn("access.token");
        when(jwtService.generateRefreshToken(any())).thenReturn("refresh.token");

        AuthResponse response = authService.registerPatient(patientInput);

        assertNotNull(response);
        assertEquals("access.token", response.getAccessToken());
        verify(patientRepository).save(any(Patient.class));
        verify(refreshTokenRepository).save(any(RefreshToken.class));
    }

    @Test
    void registerPatient_EmailExists() {
        when(userRepository.existsByEmail(any())).thenReturn(true);

        assertThrows(ValidationException.class, () -> authService.registerPatient(patientInput));
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void registerDoctor_Success() throws Exception {
        when(userRepository.existsByEmail(any())).thenReturn(false);
        when(doctorRepository.existsByLicenseNumber(any())).thenReturn(false);
        when(passwordEncoder.encode(any())).thenReturn("encodedPassword");
        when(userRepository.save(any(User.class))).thenReturn(user);
        when(objectMapper.writeValueAsString(any())).thenReturn("[\"English\"]");
        when(jwtService.generateAccessToken(any(), any(), any())).thenReturn("access.token");
        when(jwtService.generateRefreshToken(any())).thenReturn("refresh.token");

        AuthResponse response = authService.registerDoctor(doctorInput);

        assertNotNull(response);
        assertEquals("access.token", response.getAccessToken());
        verify(doctorRepository).save(any(Doctor.class));
    }

    @Test
    void registerDoctor_LicenseExists() {
        when(userRepository.existsByEmail(any())).thenReturn(false);
        when(doctorRepository.existsByLicenseNumber(any())).thenReturn(true);

        assertThrows(ValidationException.class, () -> authService.registerDoctor(doctorInput));
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void login_Success() {
        when(userRepository.findByEmail(any())).thenReturn(Optional.of(user));
        when(passwordEncoder.matches(any(), any())).thenReturn(true);
        when(jwtService.generateAccessToken(any(), any(), any())).thenReturn("access.token");
        when(jwtService.generateRefreshToken(any())).thenReturn("refresh.token");

        AuthResponse response = authService.login(loginInput);

        assertNotNull(response);
        assertEquals("access.token", response.getAccessToken());
    }

    @Test
    void login_InvalidPassword() {
        when(userRepository.findByEmail(any())).thenReturn(Optional.of(user));
        when(passwordEncoder.matches(any(), any())).thenReturn(false);

        assertThrows(UnauthorizedException.class, () -> authService.login(loginInput));
    }

    @Test
    void login_UserNotFound() {
        when(userRepository.findByEmail(any())).thenReturn(Optional.empty());

        assertThrows(UnauthorizedException.class, () -> authService.login(loginInput));
    }

    @Test
    void refreshToken_Success() {
        RefreshToken token = new RefreshToken();
        token.setToken("valid.refresh.token");
        token.setExpiresAt(LocalDateTime.now().plusDays(1));
        token.setUser(user);

        when(refreshTokenRepository.findByToken(any())).thenReturn(Optional.of(token));
        when(jwtService.generateAccessToken(any(), any(), any())).thenReturn("new.access.token");
        when(jwtService.generateRefreshToken(any())).thenReturn("new.refresh.token");

        AuthResponse response = authService.refreshToken("valid.refresh.token");

        assertNotNull(response);
        assertEquals("new.access.token", response.getAccessToken());
        verify(refreshTokenRepository).delete(token);
    }

    @Test
    void refreshToken_Expired() {
        RefreshToken token = new RefreshToken();
        token.setToken("expired.token");
        token.setExpiresAt(LocalDateTime.now().minusDays(1));
        token.setUser(user);

        when(refreshTokenRepository.findByToken(any())).thenReturn(Optional.of(token));

        assertThrows(UnauthorizedException.class, () -> authService.refreshToken("expired.token"));
        verify(refreshTokenRepository).delete(token);
    }
}
