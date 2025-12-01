package com.medical.patient.resolver;

import com.medical.common.exception.UnauthorizedException;
import com.medical.patient.dto.PatientDTO;
import com.medical.patient.dto.UpdatePatientProfileInput;
import com.medical.patient.service.PatientService;
import graphql.kickstart.tools.GraphQLMutationResolver;
import graphql.kickstart.tools.GraphQLQueryResolver;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class PatientResolver implements GraphQLQueryResolver, GraphQLMutationResolver {

    private final PatientService patientService;

    // Queries
    public PatientDTO patient(Long id) {
        return patientService.getPatientById(id);
    }

    // Mutations
    public PatientDTO updatePatientProfile(UpdatePatientProfileInput input) {
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
