package com.app.ecom;

import com.app.ecom.dto.UserRequest;
import com.app.ecom.exception.BadRequestException;
import com.app.ecom.exception.ConflictException;
import com.app.ecom.model.User;
import com.app.ecom.repository.UserRepository;
import com.app.ecom.service.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthValidationTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private UserService userService;

    @Test
    void registerUser_Success() {
        UserRequest request = new UserRequest();
        request.setFirstName("John");
        request.setLastName("Doe");
        request.setEmail("John.Doe@Example.com");
        request.setPassword("password123");

        when(userRepository.existsByEmail("john.doe@example.com")).thenReturn(false);
        when(passwordEncoder.encode("password123")).thenReturn("encodedPassword");
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
            User saved = invocation.getArgument(0);
            saved.setId(1L);
            return saved;
        });

        var response = userService.addUser(request);

        assertNotNull(response);
        assertEquals("john.doe@example.com", response.getEmail());
        verify(userRepository).existsByEmail("john.doe@example.com");
    }

    @Test
    void registerUser_DuplicateEmail_FailsWithConflict() {
        UserRequest request = new UserRequest();
        request.setEmail("User@Example.com");
        request.setPassword("password123");

        when(userRepository.existsByEmail("user@example.com")).thenReturn(true);

        assertThrows(ConflictException.class, () -> userService.addUser(request));
    }

    @Test
    void registerUser_CaseVariantDuplicateEmail_FailsWithConflict() {
        UserRequest request1 = new UserRequest();
        request1.setEmail("USER@EXAMPLE.COM");

        when(userRepository.existsByEmail("user@example.com")).thenReturn(true);

        assertThrows(ConflictException.class, () -> userService.addUser(request1));
    }

    @Test
    void registerUser_MissingEmail_FailsWithBadRequest() {
        UserRequest request = new UserRequest();
        request.setEmail("   ");

        assertThrows(BadRequestException.class, () -> userService.addUser(request));
    }
}
