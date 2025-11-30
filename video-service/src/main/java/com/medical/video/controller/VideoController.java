package com.medical.video.controller;

import com.medical.video.domain.OnlineConsultation;
import com.medical.video.dto.ConsultationTokenDTO;
import com.medical.video.dto.StartConsultationDTO;
import com.medical.video.service.VideoService;
import lombok.RequiredArgsConstructor;
import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.MutationMapping;
import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.graphql.data.method.annotation.SchemaMapping;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Controller;

import java.util.List;
import java.util.Map;

@Controller
@RequiredArgsConstructor
public class VideoController {

    private final VideoService videoService;

    @QueryMapping
    public OnlineConsultation consultation(@Argument Long id) {
        return videoService.getConsultationById(id);
    }

    @QueryMapping
    public OnlineConsultation appointmentConsultation(@Argument Long appointmentId) {
        return videoService.getConsultationByAppointmentId(appointmentId);
    }

    @QueryMapping
    @PreAuthorize("hasRole('PATIENT') or hasRole('DOCTOR')")
    public List<OnlineConsultation> myConsultations(@AuthenticationPrincipal UserDetails userDetails) {
        return videoService.getMyConsultations(userDetails.getUsername());
    }

    @MutationMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('DOCTOR')")
    public OnlineConsultation createConsultation(@Argument Long appointmentId) {
        return videoService.createConsultation(appointmentId);
    }

    @MutationMapping
    @PreAuthorize("hasRole('DOCTOR')")
    public ConsultationTokenDTO startConsultation(@Argument Map<String, Object> input, 
                                                @AuthenticationPrincipal UserDetails userDetails) {
        Long appointmentId = Long.valueOf(input.get("appointmentId").toString());
        return videoService.startConsultation(appointmentId, userDetails.getUsername());
    }

    @MutationMapping
    @PreAuthorize("hasRole('PATIENT')")
    public ConsultationTokenDTO joinConsultation(@Argument Long appointmentId, 
                                               @AuthenticationPrincipal UserDetails userDetails) {
        return videoService.joinConsultation(appointmentId, userDetails.getUsername());
    }

    @MutationMapping
    @PreAuthorize("hasRole('DOCTOR')")
    public OnlineConsultation endConsultation(@Argument Long appointmentId) {
        return videoService.endConsultation(appointmentId);
    }
}
