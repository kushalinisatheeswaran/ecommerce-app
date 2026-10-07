package com.app.ecom.controller;

import com.app.ecom.dto.OrderResponse;
import com.app.ecom.model.OrderStatus;
import com.app.ecom.model.PaymentStatus;
import com.app.ecom.service.OrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/admin/orders")
@PreAuthorize("hasRole('ADMIN')")
public class AdminOrderController {

    private final OrderService orderService;

    @GetMapping
    public ResponseEntity<List<OrderResponse>> getAllOrders(
            @RequestParam(required = false) OrderStatus status,
            @RequestParam(required = false) PaymentStatus paymentStatus) {
        List<OrderResponse> orders = orderService.getAllOrdersForAdmin(status, paymentStatus);
        return ResponseEntity.ok(orders);
    }

    @GetMapping("/{id}")
    public ResponseEntity<OrderResponse> getOrderById(@PathVariable Long id) {
        OrderResponse order = orderService.getOrderByIdForAdmin(id);
        return ResponseEntity.ok(order);
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<OrderResponse> updateOrderStatus(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        String statusStr = body.get("status");
        if (statusStr == null || statusStr.isBlank()) {
            throw new com.app.ecom.exception.BadRequestException("Status field is required.");
        }
        OrderStatus status;
        try {
            status = OrderStatus.valueOf(statusStr.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new com.app.ecom.exception.BadRequestException("Invalid order status: " + statusStr);
        }
        OrderResponse updatedOrder = orderService.updateOrderStatusForAdmin(id, status);
        return ResponseEntity.ok(updatedOrder);
    }

    @PatchMapping("/{id}/payment-status")
    public ResponseEntity<OrderResponse> updatePaymentStatus(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        String paymentStatusStr = body.get("paymentStatus");
        if (paymentStatusStr == null || paymentStatusStr.isBlank()) {
            throw new com.app.ecom.exception.BadRequestException("Payment status field is required.");
        }
        PaymentStatus paymentStatus;
        try {
            paymentStatus = PaymentStatus.valueOf(paymentStatusStr.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new com.app.ecom.exception.BadRequestException("Invalid payment status: " + paymentStatusStr);
        }
        OrderResponse updatedOrder = orderService.updatePaymentStatusForAdmin(id, paymentStatus);
        return ResponseEntity.ok(updatedOrder);
    }
}
