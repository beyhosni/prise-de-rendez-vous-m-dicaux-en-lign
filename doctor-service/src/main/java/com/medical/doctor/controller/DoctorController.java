package com.medical.doctor.controller;

import com.medical.common.exception.UnauthorizedException;
import com.medical.doctor.dto.AvailabilityDTO;
import com.medical.doctor.dto.CreateAvailabilityInput;
import com.medical.doctor.dto.DoctorDTO;
import com.medical.doctor.dto.UpdateDoctorProfileInput;
import com.medical.doctor.service.AvailabilityService;
import com.medical.doctor.service.DoctorService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.List;

@RestController
@RequestMapping("/api/doctors")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class DoctorController {

    private final DoctorService doctorService;
    private final AvailabilityService availabilityService;

    @GetMapping("/{id}")
    public ResponseEntity<DoctorDTO> getDoctor(@PathVariable Long id) {
        return ResponseEntity.ok(doctorService.getDoctorById(id));
    }

    @GetMapping("/specialty/{specialty}")
    public ResponseEntity<List<DoctorDTO>> getDoctorsBySpecialty(@PathVariable String specialty) {
        return ResponseEntity.ok(doctorService.getDoctorsBySpecialty(specialty));
    }

    @GetMapping("/search")
    public ResponseEntity<List<DoctorDTO>> searchDoctors(
            @RequestParam(required = false) String specialty,
            @RequestParam(required = false) String city) {
        return ResponseEntity.ok(doctorService.searchDoctors(specialty, city));
    }

    @GetMapping("/{doctorId}/availabilities")
    public ResponseEntity<List<AvailabilityDTO>> getDoctorAvailabilities(@PathVariable Long doctorId) {
        return ResponseEntity.ok(availabilityService.getAvailabilities(doctorId));
    }

    @PutMapping("/profile")
    public ResponseEntity<DoctorDTO> updateProfile(@Valid @RequestBody UpdateDoctorProfileInput input) {
        Long userId = getAuthenticatedUserId();
        return ResponseEntity.ok(doctorService.updateProfile(userId, input));
    }

    @PostMapping("/availabilities")
    public ResponseEntity<AvailabilityDTO> createAvailability(@Valid @RequestBody CreateAvailabilityInput input) {
        Long userId = getAuthenticatedUserId();
        return ResponseEntity.ok(availabilityService.createAvailability(userId, input));
    }

    @DeleteMapping("/availabilities/{id}")
    public ResponseEntity<Boolean> deleteAvailability(@PathVariable Long id) {
        Long userId = getAuthenticatedUserId();
        return ResponseEntity.ok(availabilityService.deleteAvailability(userId, id));
    }

    private Long getAuthenticatedUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new UnauthorizedException("User not authenticated");
        }
        try {
            return (Long) authentication.getPrincipal();
        } catch (Exception e) {
            throw new UnauthorizedException("Invalid user principal");
        }
    }
}
