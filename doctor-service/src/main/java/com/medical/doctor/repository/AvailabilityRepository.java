package com.medical.doctor.repository;

import com.medical.doctor.model.Availability;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AvailabilityRepository extends JpaRepository<Availability, Long> {

    List<Availability> findByDoctorId(Long doctorId);
    
    List<Availability> findByDoctorIdAndDayOfWeek(Long doctorId, Integer dayOfWeek);
    
    void deleteByDoctorId(Long doctorId);

}
