package com.licenta.user.controller;

import com.licenta.user.dto.AuthResponse;
import com.licenta.user.dto.LoginRequest;
import com.licenta.user.dto.RegisterRequest;
import com.licenta.user.dto.UserDTO;
import com.licenta.user.service.AuthService;
import com.licenta.user.service.UserService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;
    private final UserService userService;

    public AuthController(AuthService authService, UserService userService) {
        this.authService = authService;
        this.userService = userService;
    }

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        userService.createUser(request);
        // Auto-login după înregistrare — returnează token direct
        LoginRequest loginRequest = new LoginRequest();
        loginRequest.setUsername(request.getUsername());
        loginRequest.setPassword(request.getPassword());
        return ResponseEntity.status(HttpStatus.CREATED).body(authService.login(loginRequest));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }
}
