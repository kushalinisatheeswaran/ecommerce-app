package com.app.ecom;

import com.app.ecom.dto.CartItemRequest;
import com.app.ecom.dto.CartItemResponse;
import com.app.ecom.exception.BadRequestException;
import com.app.ecom.model.CartItem;
import com.app.ecom.model.Product;
import com.app.ecom.model.User;
import com.app.ecom.repository.CartItemRepository;
import com.app.ecom.repository.ProductRepository;
import com.app.ecom.repository.UserRepository;
import com.app.ecom.service.CartService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CartValidationTest {

    @Mock
    private ProductRepository productRepository;
    @Mock
    private CartItemRepository cartItemRepository;
    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private CartService cartService;

    @Test
    void addToCart_CumulativeQuantityExceedsStock_Fails() {
        User user = new User();
        user.setId(1L);

        Product product = new Product();
        product.setId(10L);
        product.setName("Widget");
        product.setStockQuantity(5);
        product.setPrice(new BigDecimal("20.00"));
        product.setActive(true);

        CartItem existingCartItem = CartItem.builder()
                .id(100L)
                .user(user)
                .product(product)
                .quantity(3)
                .unitPrice(new BigDecimal("20.00"))
                .price(new BigDecimal("60.00"))
                .build();

        when(productRepository.findById(10L)).thenReturn(Optional.of(product));
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(cartItemRepository.findByUserAndProduct(user, product)).thenReturn(existingCartItem);

        CartItemRequest request = new CartItemRequest();
        request.setProductId(10L);
        request.setQuantity(3); // 3 existing + 3 new = 6 > 5 stock!

        assertThrows(BadRequestException.class, () -> cartService.addCart("1", request));
    }

    @Test
    void addToCart_InactiveProduct_Fails() {
        Product product = new Product();
        product.setId(10L);
        product.setActive(false);

        when(productRepository.findById(10L)).thenReturn(Optional.of(product));

        CartItemRequest request = new CartItemRequest();
        request.setProductId(10L);
        request.setQuantity(1);

        assertThrows(BadRequestException.class, () -> cartService.addCart("1", request));
    }

    @Test
    void addToCart_InvalidQuantityZero_Fails() {
        CartItemRequest request = new CartItemRequest();
        request.setProductId(10L);
        request.setQuantity(0);

        assertThrows(BadRequestException.class, () -> cartService.addCart("1", request));
    }

    @Test
    void cartItemResponse_DoesNotExposeUserPassword() throws Exception {
        CartItemResponse response = CartItemResponse.builder()
                .id(1L)
                .productId(10L)
                .productName("Test Product")
                .unitPrice(new BigDecimal("20.00"))
                .quantity(2)
                .lineTotal(new BigDecimal("40.00"))
                .build();

        ObjectMapper mapper = new ObjectMapper();
        String json = mapper.writeValueAsString(response);

        assertFalse(json.contains("password"), "Cart JSON response must not leak password");
        assertFalse(json.contains("role"), "Cart JSON response must not leak internal user role unnecessarily");
    }
}
