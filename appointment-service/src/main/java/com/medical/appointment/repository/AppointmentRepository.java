package com.medical.appointment.repository;

import com.medical.appointment.model.Appointment;
import com.medical.common.enums.AppointmentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Repository
public interface AppointmentRepository extends JpaRepository<Appointment, Long> {

    List<Appointment> findByPatientId(Long patientId);
    
    List<Appointment> findByDoctorId(Long doctorId);
    
    List<Appointment> findByDoctorIdAndAppointmentDate(Long doctorId, LocalDate date);
    
    @Query("SELECT a FROM Appointment a WHERE a.doctorId = :doctorId " +
           "AND a.appointmentDate = :date " +
           "AND a.status != 'CANCELLED_BY_PATIENT' " +
           "AND a.status != 'CANCELLED_BY_DOCTOR'")
    List<Appointment> findActiveByDoctorAndDate(Long doctorId, LocalDate date);
    
    boolean existsByDoctorIdAndAppointmentDateAndStartTimeAndStatusNot(
            Long doctorId, LocalDate date, LocalTime startTime, AppointmentStatus status);

}
