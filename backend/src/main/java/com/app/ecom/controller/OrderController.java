package com.app.ecom.controller;

import com.app.ecom.dto.OrderResponse;
import com.app.ecom.service.OrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/orders")
public class OrderController {

    private final OrderService orderService;
    private final com.app.ecom.security.IdentityResolver identityResolver;

    @PostMapping
    public ResponseEntity<OrderResponse> createOrder(
            @RequestHeader(value = "x-user-Id", required = false) String userId) {

        String resolvedUserId = identityResolver.resolveUserId(userId);
        return orderService.createOrder(resolvedUserId)
                .map(orderResponse ->
                        new ResponseEntity<>(orderResponse, HttpStatus.CREATED)
                )
                .orElseGet(() ->
                        ResponseEntity.badRequest().build()
                );
    }

    @GetMapping
    public ResponseEntity<List<OrderResponse>> getOrders(
            @RequestHeader(value = "x-user-Id", required = false) String userId) {

        String resolvedUserId = identityResolver.resolveUserId(userId);
        List<OrderResponse> orders = orderService.getOrdersForUser(resolvedUserId);
        return ResponseEntity.ok(orders);
    }
}