package com.app.ecom.service;

import com.app.ecom.dto.WishlistItemResponse;
import com.app.ecom.exception.BadRequestException;
import com.app.ecom.exception.ResourceNotFoundException;
import com.app.ecom.model.Product;
import com.app.ecom.model.User;
import com.app.ecom.model.WishlistItem;
import com.app.ecom.repository.ProductRepository;
import com.app.ecom.repository.UserRepository;
import com.app.ecom.repository.WishlistItemRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class WishlistService {

    private final WishlistItemRepository wishlistItemRepository;
    private final UserRepository userRepository;
    private final ProductRepository productRepository;

    public List<WishlistItemResponse> getWishlistForUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));

        return wishlistItemRepository.findByUserOrderByCreatedAtDesc(user).stream()
                .map(this::mapToWishlistItemResponse)
                .toList();
    }

    @Transactional
    public WishlistItemResponse addToWishlist(Long userId, Long productId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));

        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + productId));

        if (product.getActive() != null && !product.getActive()) {
            throw new BadRequestException("Inactive product cannot be added to wishlist.");
        }

        Optional<WishlistItem> existing = wishlistItemRepository.findByUserAndProduct(user, product);
        if (existing.isPresent()) {
            return mapToWishlistItemResponse(existing.get());
        }

        WishlistItem newItem = WishlistItem.builder()
                .user(user)
                .product(product)
                .build();

        WishlistItem saved = wishlistItemRepository.save(newItem);
        return mapToWishlistItemResponse(saved);
    }

    @Transactional
    public void removeFromWishlist(Long userId, Long productId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));

        Product product = productRepository.findById(productId)
                .orElse(null);

        if (product != null) {
            wishlistItemRepository.deleteByUserAndProduct(user, product);
        }
    }

    public boolean isWishlisted(Long userId, Long productId) {
        User user = userRepository.findById(userId).orElse(null);
        Product product = productRepository.findById(productId).orElse(null);
        if (user == null || product == null) {
            return false;
        }
        return wishlistItemRepository.existsByUserAndProduct(user, product);
    }

    private WishlistItemResponse mapToWishlistItemResponse(WishlistItem item) {
        Product p = item.getProduct();
        return WishlistItemResponse.builder()
                .id(item.getId())
                .productId(p.getId())
                .productName(p.getName())
                .imageUrl(p.getImageUrl())
                .category(p.getCategory())
                .price(p.getPrice())
                .stockQuantity(p.getStockQuantity())
                .active(p.getActive() != null ? p.getActive() : true)
                .createdAt(item.getCreatedAt())
                .build();
    }
}
