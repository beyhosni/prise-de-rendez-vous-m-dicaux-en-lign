package com.medical.doctor.service;

import com.medical.common.exception.NotFoundException;
import com.medical.common.exception.ValidationException;
import com.medical.doctor.dto.AvailabilityDTO;
import com.medical.doctor.dto.CreateAvailabilityInput;
import com.medical.doctor.model.Availability;
import com.medical.doctor.model.Doctor;
import com.medical.doctor.repository.AvailabilityRepository;
import com.medical.doctor.repository.DoctorRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AvailabilityService {

    private final AvailabilityRepository availabilityRepository;
    private final DoctorRepository doctorRepository;

    public List<AvailabilityDTO> getAvailabilities(Long doctorId) {
        return availabilityRepository.findByDoctorId(doctorId).stream()
                .map(AvailabilityDTO::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional
    public AvailabilityDTO createAvailability(Long userId, CreateAvailabilityInput input) {
        Doctor doctor = doctorRepository.findByUserId(userId)
                .orElseThrow(() -> new NotFoundException("Doctor profile not found"));

        // Check if slot duration is valid (must be divisor of 60 or multiple)
        // Simplified check
        if (input.getSlotDuration() <= 0) {
            throw new ValidationException("Invalid slot duration");
        }

        // Check if end time is after start time
        if (input.getEndTime().isBefore(input.getStartTime())) {
            throw new ValidationException("End time must be after start time");
        }

        Availability availability = new Availability();
        availability.setDoctorId(doctor.getId());
        availability.setDayOfWeek(input.getDayOfWeek());
        availability.setStartTime(input.getStartTime());
        availability.setEndTime(input.getEndTime());
        availability.setSlotDuration(input.getSlotDuration());
        availability.setConsultationType(input.getConsultationType());
        availability.setIsActive(true);

        try {
            availability = availabilityRepository.save(availability);
        } catch (Exception e) {
            throw new ValidationException("Availability overlaps with existing slot or invalid data");
        }

        return AvailabilityDTO.fromEntity(availability);
    }

    @Transactional
    public Boolean deleteAvailability(Long userId, Long availabilityId) {
        Doctor doctor = doctorRepository.findByUserId(userId)
                .orElseThrow(() -> new NotFoundException("Doctor profile not found"));

        Availability availability = availabilityRepository.findById(availabilityId)
                .orElseThrow(() -> new NotFoundException("Availability not found"));

        if (!availability.getDoctorId().equals(doctor.getId())) {
            throw new ValidationException("Not authorized to delete this availability");
        }

        availabilityRepository.delete(availability);
        return true;
    }

}
