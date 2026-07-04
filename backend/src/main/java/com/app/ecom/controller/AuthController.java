package com.app.ecom.controller;

import com.app.ecom.dto.AuthRequest;
import com.app.ecom.dto.AuthResponse;
import com.app.ecom.dto.UserRequest;
import com.app.ecom.model.User;
import com.app.ecom.security.JwtService;
import com.app.ecom.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserService userService;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final UserDetailsService userDetailsService;

    @PostMapping("/register")
    public ResponseEntity<com.app.ecom.dto.RegisterResponse> register(@RequestBody @Valid UserRequest request) {
        com.app.ecom.dto.UserResponse userResponse = userService.addUser(request);
        com.app.ecom.dto.RegisterResponse response = new com.app.ecom.dto.RegisterResponse("User registered successfully", userResponse);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody @Valid AuthRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );
        User user = (User) userDetailsService.loadUserByUsername(request.getEmail());
        String token = jwtService.generateToken(user);
        return ResponseEntity.ok(new AuthResponse(token, user.getId(), user.getEmail(), user.getRole().name()));
    }
}
