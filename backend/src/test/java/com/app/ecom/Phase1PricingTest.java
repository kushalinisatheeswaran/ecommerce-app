package com.app.ecom;

import com.app.ecom.dto.OrderRequest;
import com.app.ecom.dto.OrderResponse;
import com.app.ecom.exception.BadRequestException;
import com.app.ecom.model.*;
import com.app.ecom.repository.CartItemRepository;
import com.app.ecom.repository.OrderRepository;
import com.app.ecom.repository.ProductRepository;
import com.app.ecom.repository.UserRepository;
import com.app.ecom.service.CartService;
import com.app.ecom.service.OrderService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class Phase1PricingTest {

    @Mock
    private CartService cartService;
    @Mock
    private CartItemRepository cartItemRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private OrderRepository orderRepository;
    @Mock
    private ProductRepository productRepository;

    @InjectMocks
    private OrderService orderService;

    @Test
    void createOrder_CartHasStalePrice_RejectsWithPriceUpdateErrorAndUpdatesCart() {
        User user = new User();
        user.setId(1L);

        // Product current price changed to 25.00
        Product product = new Product();
        product.setId(10L);
        product.setName("Dynamic Widget");
        product.setPrice(new BigDecimal("25.00"));
        product.setStockQuantity(10);
        product.setActive(true);

        // Cart item stored old price 20.00
        CartItem cartItem = CartItem.builder()
                .id(100L)
                .user(user)
                .product(product)
                .quantity(2)
                .unitPrice(new BigDecimal("20.00"))
                .price(new BigDecimal("40.00"))
                .build();

        OrderRequest request = new OrderRequest();
        request.setIdempotencyKey("price-test-key");
        request.setPaymentMethod(PaymentMethod.CASH_ON_DELIVERY);
        request.setFullName("Jane Doe");
        request.setPhone("1234567890");
        request.setStreet("Street");
        request.setCity("City");
        request.setState("State");
        request.setZipcode("12345");
        request.setCountry("Country");

        when(userRepository.findByIdForUpdate(1L)).thenReturn(Optional.of(user));
        when(cartService.getCartEntities("1")).thenReturn(List.of(cartItem));
        when(productRepository.findByIdForUpdate(10L)).thenReturn(Optional.of(product));

        BadRequestException ex = assertThrows(BadRequestException.class, () -> orderService.createOrder("1", request));
        assertTrue(ex.getMessage().contains("Price update detected"));

        verify(cartItemRepository, times(1)).save(argThat(c ->
                new BigDecimal("25.00").equals(c.getUnitPrice()) && new BigDecimal("50.00").equals(c.getPrice())
        ));
    }

    @Test
    void createOrder_CartMatchesCurrentPrice_CheckoutUsesLatestPrice() {
        User user = new User();
        user.setId(1L);

        Product product = new Product();
        product.setId(10L);
        product.setName("Dynamic Widget");
        product.setPrice(new BigDecimal("25.00"));
        product.setStockQuantity(10);
        product.setActive(true);

        CartItem cartItem = CartItem.builder()
                .id(100L)
                .user(user)
                .product(product)
                .quantity(2)
                .unitPrice(new BigDecimal("25.00"))
                .price(new BigDecimal("50.00"))
                .build();

        OrderRequest request = new OrderRequest();
        request.setIdempotencyKey("price-match-key");
        request.setPaymentMethod(PaymentMethod.CASH_ON_DELIVERY);
        request.setFullName("Jane Doe");
        request.setPhone("1234567890");
        request.setStreet("Street");
        request.setCity("City");
        request.setState("State");
        request.setZipcode("12345");
        request.setCountry("Country");

        when(userRepository.findByIdForUpdate(1L)).thenReturn(Optional.of(user));
        when(cartService.getCartEntities("1")).thenReturn(List.of(cartItem));
        when(productRepository.findByIdForUpdate(10L)).thenReturn(Optional.of(product));
        when(orderRepository.save(any(Order.class))).thenAnswer(invocation -> {
            Order o = invocation.getArgument(0);
            o.setId(600L);
            return o;
        });

        Optional<OrderResponse> response = orderService.createOrder("1", request);

        assertTrue(response.isPresent());
        OrderResponse orderRes = response.get();

        assertEquals(new BigDecimal("50.00"), orderRes.getSubtotal());
        assertEquals(new BigDecimal("25.00"), orderRes.getItems().get(0).getUnitPrice());
    }
}
