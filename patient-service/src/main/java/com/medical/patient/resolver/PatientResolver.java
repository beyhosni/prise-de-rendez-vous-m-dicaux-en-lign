package com.medical.patient.resolver;

import com.medical.common.exception.UnauthorizedException;
import com.medical.patient.dto.PatientDTO;
import com.medical.patient.dto.UpdatePatientProfileInput;
import com.medical.patient.service.PatientService;
import lombok.RequiredArgsConstructor;
import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.MutationMapping;
import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Controller;

@Controller
@RequiredArgsConstructor
public class PatientResolver {

    private final PatientService patientService;

    // Queries
    @QueryMapping
    public PatientDTO patient(@Argument Long id) {
        return patientService.getPatientById(id);
    }

    // Mutations
    @MutationMapping
    public PatientDTO updatePatientProfile(@Argument UpdatePatientProfileInput input) {
        Long userId = getAuthenticatedUserId();
        return patientService.updateProfile(userId, input);
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
