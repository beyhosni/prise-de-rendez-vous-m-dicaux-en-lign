package com.medical.gateway.security;

import com.medical.gateway.service.AuthServiceClient;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.Collections;

@Service
@RequiredArgsConstructor
@Slf4j
public class CustomUserDetailsService implements UserDetailsService {

    private final AuthServiceClient authServiceClient;

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        try {
            // Récupérer les détails de l'utilisateur depuis le service d'authentification
            var userInfo = authServiceClient.getUserInfo(email);

            // Extraire le rôle de l'utilisateur
            String role = userInfo.get("role").toString();

            // Créer et retourner un objet UserDetails
            return User.builder()
                    .username(email)
                    .password("") // Le mot de passe n'est pas nécessaire pour la validation du token
                    .authorities(Collections.singletonList(new SimpleGrantedAuthority("ROLE_" + role)))
                    .accountExpired(false)
                    .accountLocked(false)
                    .credentialsExpired(false)
                    .disabled(!Boolean.parseBoolean(userInfo.get("isActive").toString()))
                    .build();

        } catch (Exception e) {
            log.error("Erreur lors du chargement des détails de l'utilisateur {}: {}", email, e.getMessage());
            throw new UsernameNotFoundException("Utilisateur non trouvé: " + email);
        }
    }
}
