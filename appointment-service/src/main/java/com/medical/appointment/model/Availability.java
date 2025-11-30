package com.medical.appointment.model;

import com.medical.common.enums.ConsultationType;
import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalTime;

@Entity
@Table(name = "availabilities")
@Data
public class Availability {

    @Id
    private Long id;

    @Column(name = "doctor_id")
    private Long doctorId;

    @Column(name = "day_of_week")
    private Integer dayOfWeek;

    @Column(name = "start_time")
    private LocalTime startTime;

    @Column(name = "end_time")
    private LocalTime endTime;

    @Column(name = "slot_duration")
    private Integer slotDuration;

    @Enumerated(EnumType.STRING)
    @Column(name = "consultation_type")
    private ConsultationType consultationType;

    @Column(name = "is_active")
    private Boolean isActive;

}
