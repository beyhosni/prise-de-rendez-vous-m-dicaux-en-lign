package com.medical.doctor.resolver;

import com.medical.common.exception.UnauthorizedException;
import com.medical.doctor.dto.AvailabilityDTO;
import com.medical.doctor.dto.CreateAvailabilityInput;
import com.medical.doctor.dto.DoctorDTO;
import com.medical.doctor.dto.UpdateDoctorProfileInput;
import com.medical.doctor.service.AvailabilityService;
import com.medical.doctor.service.DoctorService;
import lombok.RequiredArgsConstructor;
import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.MutationMapping;
import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Controller;

import java.util.List;

@Controller
@RequiredArgsConstructor
public class DoctorResolver {

    private final DoctorService doctorService;
    private final AvailabilityService availabilityService;

    // Queries
    @QueryMapping
    public DoctorDTO doctor(@Argument Long id) {
        return doctorService.getDoctorById(id);
    }

    @QueryMapping
    public List<DoctorDTO> doctorsBySpecialty(@Argument String specialty) {
        return doctorService.getDoctorsBySpecialty(specialty);
    }

    @QueryMapping
    public List<DoctorDTO> searchDoctors(@Argument String specialty, @Argument String city) {
        return doctorService.searchDoctors(specialty, city);
    }

    @QueryMapping
    public List<AvailabilityDTO> doctorAvailabilities(@Argument Long doctorId) {
        return availabilityService.getAvailabilities(doctorId);
    }

    // Mutations
    @MutationMapping
    public DoctorDTO updateDoctorProfile(@Argument UpdateDoctorProfileInput input) {
        Long userId = getAuthenticatedUserId();
        return doctorService.updateProfile(userId, input);
    }

    @MutationMapping
    public AvailabilityDTO createAvailability(@Argument CreateAvailabilityInput input) {
        Long userId = getAuthenticatedUserId();
        return availabilityService.createAvailability(userId, input);
    }

    @MutationMapping
    public Boolean deleteAvailability(@Argument Long id) {
        Long userId = getAuthenticatedUserId();
        return availabilityService.deleteAvailability(userId, id);
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
