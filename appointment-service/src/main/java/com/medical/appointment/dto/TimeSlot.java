package com.medical.appointment.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TimeSlot {

    private LocalTime startTime;
    private LocalTime endTime;
    private Boolean isAvailable;

}
