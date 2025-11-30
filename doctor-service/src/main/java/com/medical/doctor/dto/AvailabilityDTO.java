package com.medical.doctor.dto;

import com.medical.common.enums.ConsultationType;
import com.medical.doctor.model.Availability;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AvailabilityDTO {

    private Long id;
    private Long doctorId;
    private Integer dayOfWeek;
    private LocalTime startTime;
    private LocalTime endTime;
    private Integer slotDuration;
    private ConsultationType consultationType;
    private Boolean isActive;

    public static AvailabilityDTO fromEntity(Availability availability) {
        if (availability == null) return null;
        
        AvailabilityDTO dto = new AvailabilityDTO();
        dto.setId(availability.getId());
        dto.setDoctorId(availability.getDoctorId());
        dto.setDayOfWeek(availability.getDayOfWeek());
        dto.setStartTime(availability.getStartTime());
        dto.setEndTime(availability.getEndTime());
        dto.setSlotDuration(availability.getSlotDuration());
        dto.setConsultationType(availability.getConsultationType());
        dto.setIsActive(availability.getIsActive());
        return dto;
    }

}
