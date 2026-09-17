package com.app.ecom.dto;

import com.app.ecom.model.OrderStatus;
import com.app.ecom.model.PaymentMethod;
import com.app.ecom.model.PaymentStatus;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class OrderResponse {
    private Long id;
    private BigDecimal subtotal;
    private BigDecimal discountAmount;
    private BigDecimal deliveryFee;
    private BigDecimal codFee;
    private BigDecimal totalAmount;
    private OrderStatus status;
    private PaymentMethod paymentMethod;
    private PaymentStatus paymentStatus;
    private String cardLast4;

    private String shippingFullName;
    private String shippingPhone;
    private String shippingStreet;
    private String shippingCity;
    private String shippingState;
    private String shippingZipcode;
    private String shippingCountry;

    private List<OrderItemDTO> items;
    private LocalDateTime createdAt;
}
