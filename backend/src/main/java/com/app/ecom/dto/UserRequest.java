package com.app.ecom.dto;

import com.app.ecom.model.UserRole;
import lombok.Data;
import jakarta.validation.constraints.*;
import jakarta.validation.Valid;

@Data
public class UserRequest {
    @NotBlank(message = "First name is required")
    private String firstName;

    @NotBlank(message = "Last name is required")
    private String lastName;

    @NotBlank(message = "Email is required")
    @Email(message = "Email must be valid")
    private String email;

    private String phone;

    @NotBlank(message = "Password is required")
    @Size(min = 6, message = "Password must be at least 6 characters")
    private String password;

    @Valid
    private AddressDTO address;
}
