package com.app.ecom.controller;

import com.app.ecom.dto.WishlistItemResponse;
import com.app.ecom.security.IdentityResolver;
import com.app.ecom.service.WishlistService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/wishlist")
@RequiredArgsConstructor
public class WishlistController {

    private final WishlistService wishlistService;
    private final IdentityResolver identityResolver;

    @GetMapping
    public ResponseEntity<List<WishlistItemResponse>> getMyWishlist(
            @RequestHeader(value = "x-user-id", required = false) String userIdHeader) {
        String userIdStr = identityResolver.resolveUserId(userIdHeader);
        Long userId = Long.valueOf(userIdStr);
        return ResponseEntity.ok(wishlistService.getWishlistForUser(userId));
    }

    @PostMapping("/{productId}")
    public ResponseEntity<WishlistItemResponse> addToWishlist(
            @RequestHeader(value = "x-user-id", required = false) String userIdHeader,
            @PathVariable Long productId) {
        String userIdStr = identityResolver.resolveUserId(userIdHeader);
        Long userId = Long.valueOf(userIdStr);
        WishlistItemResponse response = wishlistService.addToWishlist(userId, productId);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @DeleteMapping("/{productId}")
    public ResponseEntity<Void> removeFromWishlist(
            @RequestHeader(value = "x-user-id", required = false) String userIdHeader,
            @PathVariable Long productId) {
        String userIdStr = identityResolver.resolveUserId(userIdHeader);
        Long userId = Long.valueOf(userIdStr);
        wishlistService.removeFromWishlist(userId, productId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/check/{productId}")
    public ResponseEntity<Map<String, Boolean>> checkWishlist(
            @RequestHeader(value = "x-user-id", required = false) String userIdHeader,
            @PathVariable Long productId) {
        String userIdStr = identityResolver.resolveUserId(userIdHeader);
        Long userId = Long.valueOf(userIdStr);
        boolean isWishlisted = wishlistService.isWishlisted(userId, productId);
        return ResponseEntity.ok(Map.of("wishlisted", isWishlisted));
    }
}
