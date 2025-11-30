package com.medical.video.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ConsultationTokenDTO {
    private String token;
    private String roomUrl;
    private LocalDateTime expiresAt;
}
