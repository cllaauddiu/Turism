package com.licenta.user.service;

import com.licenta.user.dto.AuthResponse;
import com.licenta.user.dto.LoginRequest;
import com.licenta.user.entity.Role;
import com.licenta.user.entity.User;
import com.licenta.user.security.JwtService;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final UserDetailsService userDetailsService;
    private final JwtService jwtService;

    public AuthService(AuthenticationManager authenticationManager,
                       UserDetailsService userDetailsService,
                       JwtService jwtService) {
        this.authenticationManager = authenticationManager;
        this.userDetailsService = userDetailsService;
        this.jwtService = jwtService;
    }

    public AuthResponse login(LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword())
        );

        UserDetails userDetails = userDetailsService.loadUserByUsername(request.getUsername());

        String role = userDetails.getAuthorities().stream()
                .findFirst()
                .map(a -> a.getAuthority().replace("ROLE_", ""))
                .orElse("UNKNOWN");

        java.util.Map<String, Object> claims = new java.util.HashMap<>();
        claims.put("role", role);

        String token = jwtService.generateToken(claims, userDetails);

        return AuthResponse.builder()
                .token(token)
                .username(userDetails.getUsername())
                .role(role)
                .build();
    }

    public AuthResponse loginAsGuest() {
        String guestUsername = "guest_" + java.util.UUID.randomUUID().toString().substring(0, 8);

        User guestUser = User.builder()
                .username(guestUsername)
                .password("")
                .role(Role.GUEST)
                .build();

        java.util.Map<String, Object> claims = new java.util.HashMap<>();
        claims.put("role", Role.GUEST.name());

        String token = jwtService.generateToken(claims, guestUser);

        return AuthResponse.builder()
                .token(token)
                .username(guestUsername)
                .role(Role.GUEST.name())
                .build();
    }
}
