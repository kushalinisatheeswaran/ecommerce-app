package com.app.ecom.dto;

import com.app.ecom.model.PaymentMethod;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class OrderRequest {
    @NotNull(message = "Payment method is required")
    private PaymentMethod paymentMethod;

    private String cardLast4;

    @NotBlank(message = "Full name is required")
    private String fullName;

    @NotBlank(message = "Phone number is required")
    private String phone;

    @NotBlank(message = "Street address is required")
    private String street;

    @NotBlank(message = "City is required")
    private String city;

    @NotBlank(message = "State/Province is required")
    private String state;

    @NotBlank(message = "Zipcode is required")
    private String zipcode;

    @NotBlank(message = "Country is required")
    private String country;

    private boolean saveAddressToProfile;
}
