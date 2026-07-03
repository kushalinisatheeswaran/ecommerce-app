package com.app.ecom.controller;

import com.app.ecom.dto.CartItemRequest;
import com.app.ecom.model.CartItem;
import com.app.ecom.service.CartService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.List;

@RestController
@RequestMapping("/api/cart")
@RequiredArgsConstructor
public class CartController {

    private final CartService cartService;
    private final com.app.ecom.security.IdentityResolver identityResolver;

    @PostMapping
    public ResponseEntity<String> addToCart(
            @RequestHeader(value = "x-user-id", required = false) String userId,
            @RequestBody @Valid CartItemRequest request) {

        String resolvedUserId = identityResolver.resolveUserId(userId);
        boolean added = cartService.addCart(resolvedUserId, request);

        if (!added) {
            return ResponseEntity.badRequest()
                    .body("Product Out of Stock or User not Found or Product not Found");
        }

        return ResponseEntity.status(HttpStatus.CREATED).body("Item added to cart");
    }

    @DeleteMapping("/items/{productId}")
    public ResponseEntity<Void> removeFromCart(
            @RequestHeader(value = "x-user-id", required = false) String userId,
            @PathVariable Long productId) {

        String resolvedUserId = identityResolver.resolveUserId(userId);
        boolean deleted = cartService.deleteItemFromCart(resolvedUserId, productId);

        return deleted
                ? ResponseEntity.noContent().build()
                : ResponseEntity.notFound().build();
    }

    @GetMapping
    public ResponseEntity<List<CartItem>> getCart(
            @RequestHeader(value = "x-user-id", required = false) String userId) {

        String resolvedUserId = identityResolver.resolveUserId(userId);
        List<CartItem> cartItems = cartService.getCart(resolvedUserId);
        return ResponseEntity.ok(cartItems);
    }
}