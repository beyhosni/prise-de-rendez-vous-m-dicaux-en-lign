package com.medical.auth.dto;

import com.medical.auth.model.User;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AuthResponse {

    private String accessToken;
    private String refreshToken;
    private UserDTO user;

    public static AuthResponse of(String accessToken, String refreshToken, User user) {
        return new AuthResponse(accessToken, refreshToken, UserDTO.fromEntity(user));
    }

}
