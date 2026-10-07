package com.app.ecom.service;

import com.app.ecom.dto.CartItemRequest;
import com.app.ecom.dto.CartItemResponse;
import com.app.ecom.exception.BadRequestException;
import com.app.ecom.model.CartItem;
import com.app.ecom.model.Product;
import com.app.ecom.model.User;
import com.app.ecom.repository.CartItemRepository;
import com.app.ecom.repository.ProductRepository;
import com.app.ecom.repository.UserRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Transactional
public class CartService {

    private final ProductRepository productRepository;
    private final CartItemRepository cartItemRepository;
    private final UserRepository userRepository;

    public List<CartItemResponse> getCart(String userId) {
        return getCartEntities(userId).stream()
                .map(this::mapToCartItemResponse)
                .toList();
    }

    public List<CartItem> getCartEntities(String userId) {
        return userRepository.findById(Long.valueOf(userId))
                .map(cartItemRepository::findByUser)
                .orElseGet(List::of);
    }

    private static final int MAX_CART_QUANTITY = 999;

    public boolean addCart(String userId, CartItemRequest request) {
        if (request.getQuantity() == null || request.getQuantity() <= 0) {
            throw new BadRequestException("Quantity must be at least 1.");
        }
        if (request.getQuantity() > MAX_CART_QUANTITY) {
            throw new BadRequestException("Quantity exceeds maximum allowed limit per item (" + MAX_CART_QUANTITY + ").");
        }

        Product product = productRepository.findById(request.getProductId())
                .orElseThrow(() -> new BadRequestException("Product not found with id: " + request.getProductId()));

        if (!Boolean.TRUE.equals(product.getActive())) {
            throw new BadRequestException("Product " + product.getName() + " is inactive and cannot be added to cart.");
        }

        User user = userRepository.findById(Long.valueOf(userId))
                .orElseThrow(() -> new BadRequestException("User not found with id: " + userId));

        CartItem existingCartItem = cartItemRepository.findByUserAndProduct(user, product);
        int existingQty = existingCartItem != null ? existingCartItem.getQuantity() : 0;
        
        long targetQtyLong = (long) existingQty + request.getQuantity();
        if (targetQtyLong > MAX_CART_QUANTITY || targetQtyLong > Integer.MAX_VALUE) {
            throw new BadRequestException("Requested total quantity exceeds maximum allowed limit per item (" + MAX_CART_QUANTITY + ").");
        }
        int targetQty = (int) targetQtyLong;

        if (product.getStockQuantity() < targetQty) {
            throw new BadRequestException("Requested total quantity (" + targetQty + ") exceeds available stock (" + product.getStockQuantity() + ").");
        }

        BigDecimal unitPrice = product.getPrice();
        BigDecimal lineTotal = unitPrice.multiply(BigDecimal.valueOf(targetQty));

        if (existingCartItem != null) {
            existingCartItem.setQuantity(targetQty);
            existingCartItem.setUnitPrice(unitPrice);
            existingCartItem.setPrice(lineTotal);
            cartItemRepository.save(existingCartItem);
        } else {
            CartItem cartItem = CartItem.builder()
                    .user(user)
                    .product(product)
                    .quantity(targetQty)
                    .unitPrice(unitPrice)
                    .price(lineTotal)
                    .build();
            cartItemRepository.save(cartItem);
        }
        return true;
    }

    public boolean deleteItemFromCart(String userId, Long productId) {
        Optional<Product> productOpt = productRepository.findById(productId);
        Optional<User> userOpt = userRepository.findById(Long.valueOf(userId));
        if (productOpt.isPresent() && userOpt.isPresent()) {
            CartItem cartItem = cartItemRepository.findByUserAndProduct(userOpt.get(), productOpt.get());
            if (cartItem != null) {
                cartItemRepository.delete(cartItem);
                return true;
            }
        }
        return false;
    }

    public boolean updateCartItemQuantity(String userId, Long productId, int quantity) {
        if (quantity <= 0) {
            return deleteItemFromCart(userId, productId);
        }
        if (quantity > MAX_CART_QUANTITY) {
            throw new BadRequestException("Quantity exceeds maximum allowed limit per item (" + MAX_CART_QUANTITY + ").");
        }
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new BadRequestException("Product not found"));

        if (!Boolean.TRUE.equals(product.getActive())) {
            throw new BadRequestException("Cannot update quantity for inactive product.");
        }

        User user = userRepository.findById(Long.valueOf(userId))
                .orElseThrow(() -> new BadRequestException("User not found"));

        if (product.getStockQuantity() < quantity) {
            throw new BadRequestException("Requested quantity (" + quantity + ") exceeds available stock (" + product.getStockQuantity() + ").");
        }

        CartItem cartItem = cartItemRepository.findByUserAndProduct(user, product);
        if (cartItem != null) {
            BigDecimal unitPrice = product.getPrice();
            BigDecimal lineTotal = unitPrice.multiply(BigDecimal.valueOf(quantity));
            cartItem.setQuantity(quantity);
            cartItem.setUnitPrice(unitPrice);
            cartItem.setPrice(lineTotal);
            cartItemRepository.save(cartItem);
            return true;
        }
        return false;
    }

    public void clearCart(String userId) {
        userRepository.findById(Long.valueOf(userId))
                .ifPresent(cartItemRepository::deleteByUser);
    }

    private CartItemResponse mapToCartItemResponse(CartItem item) {
        BigDecimal unitPrice = item.getUnitPrice() != null ? item.getUnitPrice() : (item.getProduct() != null ? item.getProduct().getPrice() : BigDecimal.ZERO);
        BigDecimal lineTotal = item.getPrice() != null ? item.getPrice() : unitPrice.multiply(BigDecimal.valueOf(item.getQuantity()));

        CartItemResponse.ProductSummary productSummary = item.getProduct() != null
                ? CartItemResponse.ProductSummary.builder()
                .id(item.getProduct().getId())
                .name(item.getProduct().getName())
                .imageUrl(item.getProduct().getImageUrl())
                .price(item.getProduct().getPrice())
                .stockQuantity(item.getProduct().getStockQuantity())
                .active(item.getProduct().getActive())
                .build()
                : null;

        return CartItemResponse.builder()
                .id(item.getId())
                .productId(item.getProduct() != null ? item.getProduct().getId() : null)
                .productName(item.getProduct() != null ? item.getProduct().getName() : null)
                .productImage(item.getProduct() != null ? item.getProduct().getImageUrl() : null)
                .unitPrice(unitPrice)
                .quantity(item.getQuantity())
                .lineTotal(lineTotal)
                .stockQuantity(item.getProduct() != null ? item.getProduct().getStockQuantity() : 0)
                .active(item.getProduct() != null ? item.getProduct().getActive() : false)
                .product(productSummary)
                .build();
    }
}
