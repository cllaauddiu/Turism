package com.licenta.chatbox.security;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.stereotype.Component;

@Component
public class AuthHelper {

    private final JwtService jwtService;

    public AuthHelper(JwtService jwtService) {
        this.jwtService = jwtService;
    }

    public StompPrincipal requireUser(HttpServletRequest request) {
        String authHeader = request.getHeader("Authorization");
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            throw new UnauthorizedException("Missing or invalid Authorization header");
        }
        String token = authHeader.substring(7);
        if (!jwtService.isTokenValid(token)) {
            throw new UnauthorizedException("Invalid JWT token");
        }
        return new StompPrincipal(jwtService.extractUsername(token), jwtService.extractRole(token));
    }

    public StompPrincipal requireAdmin(HttpServletRequest request) {
        StompPrincipal user = requireUser(request);
        if (!user.isAdmin()) {
            throw new UnauthorizedException("Admin role required");
        }
        return user;
    }

    public static class UnauthorizedException extends RuntimeException {
        public UnauthorizedException(String message) {
            super(message);
        }
    }
}
