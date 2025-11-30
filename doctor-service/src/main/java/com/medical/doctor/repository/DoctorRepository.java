package com.medical.doctor.repository;

import com.medical.doctor.model.Doctor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DoctorRepository extends JpaRepository<Doctor, Long> {

    Optional<Doctor> findByUserId(Long userId);
    
    List<Doctor> findBySpecialty(String specialty);
    
    @Query("SELECT DISTINCT d.specialty FROM Doctor d")
    List<String> findAllSpecialties();
    
    // Search query
    @Query("SELECT d FROM Doctor d WHERE " +
           "(:specialty IS NULL OR d.specialty = :specialty) AND " +
           "(:city IS NULL OR d.city = :city)")
    List<Doctor> searchDoctors(String specialty, String city);

}
