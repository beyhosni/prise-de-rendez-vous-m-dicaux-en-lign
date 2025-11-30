package com.medical.appointment.service;

import com.medical.appointment.dto.TimeSlot;
import com.medical.appointment.model.Appointment;
import com.medical.appointment.model.Availability;
import com.medical.appointment.repository.AppointmentRepository;
import com.medical.appointment.repository.AvailabilityRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class SlotService {

    private final AvailabilityRepository availabilityRepository;
    private final AppointmentRepository appointmentRepository;

    public List<TimeSlot> getAvailableSlots(Long doctorId, LocalDate date) {
        // 1. Get doctor's availability for the day of week
        int dayOfWeek = date.getDayOfWeek().getValue() % 7; // Java: 1=Mon, 7=Sun. DB: 0=Sun, 6=Sat.
        // Adjust: if Java 7 (Sun) -> 0. If Java 1 (Mon) -> 1.
        // Wait, Java DayOfWeek.SUNDAY is 7. My DB uses 0 for Sunday.
        if (dayOfWeek == 7) dayOfWeek = 0;

        List<Availability> availabilities = availabilityRepository.findByDoctorIdAndDayOfWeek(doctorId, dayOfWeek);
        
        // 2. Get existing appointments
        List<Appointment> existingAppointments = appointmentRepository.findActiveByDoctorAndDate(doctorId, date);
        
        List<TimeSlot> slots = new ArrayList<>();
        
        for (Availability availability : availabilities) {
            if (!availability.getIsActive()) continue;
            
            LocalTime current = availability.getStartTime();
            LocalTime end = availability.getEndTime();
            int duration = availability.getSlotDuration();
            
            while (current.plusMinutes(duration).isBefore(end) || current.plusMinutes(duration).equals(end)) {
                LocalTime slotEnd = current.plusMinutes(duration);
                
                // Check collision
                boolean isAvailable = true;
                for (Appointment appt : existingAppointments) {
                    // Check overlap
                    if (isOverlapping(current, slotEnd, appt.getStartTime(), appt.getEndTime())) {
                        isAvailable = false;
                        break;
                    }
                }
                
                // Also check if date is today, filter past times
                if (date.equals(LocalDate.now()) && current.isBefore(LocalTime.now())) {
                    isAvailable = false;
                }
                
                slots.add(new TimeSlot(current, slotEnd, isAvailable));
                current = current.plusMinutes(duration);
            }
        }
        
        return slots;
    }
    
    private boolean isOverlapping(LocalTime start1, LocalTime end1, LocalTime start2, LocalTime end2) {
        return start1.isBefore(end2) && start2.isBefore(end1);
    }

}
