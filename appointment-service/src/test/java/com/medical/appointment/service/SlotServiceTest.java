package com.medical.appointment.service;

import com.medical.appointment.dto.TimeSlot;
import com.medical.appointment.model.Appointment;
import com.medical.appointment.model.Availability;
import com.medical.appointment.repository.AppointmentRepository;
import com.medical.appointment.repository.AvailabilityRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SlotServiceTest {

    @Mock
    private AvailabilityRepository availabilityRepository;
    @Mock
    private AppointmentRepository appointmentRepository;

    @InjectMocks
    private SlotService slotService;

    private Availability availability;
    private Appointment appointment;

    @BeforeEach
    void setUp() {
        availability = new Availability();
        availability.setDoctorId(1L);
        availability.setDayOfWeek(1);
        availability.setStartTime(LocalTime.of(9, 0));
        availability.setEndTime(LocalTime.of(10, 0)); // 2 slots: 9:00, 9:30
        availability.setSlotDuration(30);
        availability.setIsActive(true);

        appointment = new Appointment();
        appointment.setStartTime(LocalTime.of(9, 0));
        appointment.setEndTime(LocalTime.of(9, 30));
    }

    @Test
    void getAvailableSlots_Success() {
        when(availabilityRepository.findByDoctorIdAndDayOfWeek(any(), any())).thenReturn(Collections.singletonList(availability));
        when(appointmentRepository.findActiveByDoctorAndDate(any(), any())).thenReturn(Collections.emptyList());

        List<TimeSlot> slots = slotService.getAvailableSlots(1L, LocalDate.now().plusDays(1)); // Future date

        assertEquals(2, slots.size());
        assertTrue(slots.get(0).getIsAvailable());
        assertTrue(slots.get(1).getIsAvailable());
    }

    @Test
    void getAvailableSlots_WithBooking() {
        when(availabilityRepository.findByDoctorIdAndDayOfWeek(any(), any())).thenReturn(Collections.singletonList(availability));
        when(appointmentRepository.findActiveByDoctorAndDate(any(), any())).thenReturn(Collections.singletonList(appointment));

        List<TimeSlot> slots = slotService.getAvailableSlots(1L, LocalDate.now().plusDays(1));

        assertEquals(2, slots.size());
        assertFalse(slots.get(0).getIsAvailable()); // 9:00 is booked
        assertTrue(slots.get(1).getIsAvailable());  // 9:30 is free
    }
}
