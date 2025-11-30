package com.medical.doctor.resolver;

import com.medical.common.exception.UnauthorizedException;
import com.medical.doctor.dto.AvailabilityDTO;
import com.medical.doctor.dto.CreateAvailabilityInput;
import com.medical.doctor.dto.DoctorDTO;
import com.medical.doctor.dto.UpdateDoctorProfileInput;
import com.medical.doctor.service.AvailabilityService;
import com.medical.doctor.service.DoctorService;
import graphql.kickstart.tools.GraphQLMutationResolver;
import graphql.kickstart.tools.GraphQLQueryResolver;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
public class DoctorResolver implements GraphQLQueryResolver, GraphQLMutationResolver {

    private final DoctorService doctorService;
    private final AvailabilityService availabilityService;

    // Queries
    public DoctorDTO doctor(Long id) {
        return doctorService.getDoctorById(id);
    }

    public List<DoctorDTO> doctorsBySpecialty(String specialty) {
        return doctorService.getDoctorsBySpecialty(specialty);
    }

    public List<DoctorDTO> searchDoctors(String specialty, String city) {
        return doctorService.searchDoctors(specialty, city);
    }

    public List<AvailabilityDTO> doctorAvailabilities(Long doctorId) {
        return availabilityService.getAvailabilities(doctorId);
    }

    // Mutations
    public DoctorDTO updateDoctorProfile(UpdateDoctorProfileInput input) {
        Long userId = getAuthenticatedUserId();
        return doctorService.updateProfile(userId, input);
    }

    public AvailabilityDTO createAvailability(CreateAvailabilityInput input) {
        Long userId = getAuthenticatedUserId();
        return availabilityService.createAvailability(userId, input);
    }

    public Boolean deleteAvailability(Long id) {
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
