package com.app.ecom.controller;

import com.app.ecom.dto.CartItemRequest;
import com.app.ecom.model.CartItem;
import com.app.ecom.service.CartService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/cart")
@RequiredArgsConstructor
public class CartController {

    private final CartService cartService;

    @PostMapping
    public ResponseEntity<String> addToCart(
            @RequestHeader("x-user-id") String userId,
            @RequestBody CartItemRequest request) {

        boolean added = cartService.addCart(userId, request);

        if (!added) {
            return ResponseEntity.badRequest()
                    .body("Product Out of Stock or User not Found or Product not Found");
        }

        return ResponseEntity.status(HttpStatus.CREATED).body("Item added to cart");
    }

    @DeleteMapping("/items/{productId}")
    public ResponseEntity<Void> removeFromCart(
            @RequestHeader("x-user-id") String userId,
            @PathVariable Long productId) {

        boolean deleted = cartService.deleteItemFromCart(userId, productId);

        return deleted
                ? ResponseEntity.noContent().build()
                : ResponseEntity.notFound().build();
    }

    @GetMapping
    public ResponseEntity<List<CartItem>> getCart(
            @RequestHeader("x-user-id") String userId) {

        List<CartItem> cartItems = cartService.getCart(userId);
        return ResponseEntity.ok(cartItems);
    }
}