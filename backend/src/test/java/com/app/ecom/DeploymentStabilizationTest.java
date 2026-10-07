package com.app.ecom;

import com.app.ecom.dto.*;
import com.app.ecom.exception.BadRequestException;
import com.app.ecom.model.*;
import com.app.ecom.repository.*;
import com.app.ecom.service.CartPriceUpdateService;
import com.app.ecom.service.CartService;
import com.app.ecom.service.OrderService;
import org.junit.jupiter.api.BeforeEach;
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
class DeploymentStabilizationTest {

    @Mock
    private ProductRepository productRepository;

    @Mock
    private CartItemRepository cartItemRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private CartPriceUpdateService cartPriceUpdateService;

    @Mock
    private CartService cartServiceMock;

    @InjectMocks
    private OrderService orderService;

    private CartService cartService;

    private User testUser;
    private Product testProduct;
    private CartItem testCartItem;

    @BeforeEach
    void setUp() {
        cartService = new CartService(productRepository, cartItemRepository, userRepository);

        testUser = new User();
        testUser.setId(1L);
        testUser.setEmail("user@example.com");

        testProduct = new Product();
        testProduct.setId(10L);
        testProduct.setName("Smartphone");
        testProduct.setPrice(new BigDecimal("500.00"));
        testProduct.setStockQuantity(10);
        testProduct.setActive(true);

        testCartItem = new CartItem();
        testCartItem.setId(100L);
        testCartItem.setUser(testUser);
        testCartItem.setProduct(testProduct);
        testCartItem.setQuantity(2);
        testCartItem.setUnitPrice(new BigDecimal("500.00"));
        testCartItem.setPrice(new BigDecimal("1000.00"));
    }

    @Test
    void P0_1_addCart_quantityOverflow_rejected() {
        CartItemRequest req = new CartItemRequest();
        req.setProductId(10L);
        req.setQuantity(Integer.MAX_VALUE);

        assertThrows(BadRequestException.class, () -> cartService.addCart("1", req));
    }

    @Test
    void P0_1_addCart_negativeQuantity_rejected() {
        CartItemRequest req = new CartItemRequest();
        req.setProductId(10L);
        req.setQuantity(-5);

        assertThrows(BadRequestException.class, () -> cartService.addCart("1", req));
    }

    @Test
    void P0_1_addCart_exceedsStock_rejected() {
        when(productRepository.findById(10L)).thenReturn(Optional.of(testProduct));
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));

        CartItemRequest req = new CartItemRequest();
        req.setProductId(10L);
        req.setQuantity(15); // stock is 10

        assertThrows(BadRequestException.class, () -> cartService.addCart("1", req));
    }

    @Test
    void P0_1_checkout_invalidPersistedQuantity_rejected() {
        testCartItem.setQuantity(-1);
        when(userRepository.findByIdForUpdate(1L)).thenReturn(Optional.of(testUser));
        when(cartServiceMock.getCartEntities("1")).thenReturn(List.of(testCartItem));

        OrderRequest req = new OrderRequest();
        req.setIdempotencyKey("idemp-invalid-qty");
        req.setPaymentMethod(PaymentMethod.CASH_ON_DELIVERY);

        assertThrows(BadRequestException.class, () -> orderService.createOrder("1", req));
    }

    @Test
    void P0_2_checkout_stalePrice_persistedAndRejectedWithoutOrderCreation() {
        when(cartPriceUpdateService.checkAndUpdateStalePrices(1L)).thenReturn(true);

        OrderRequest req = new OrderRequest();
        req.setIdempotencyKey("idemp-stale-price");
        req.setPaymentMethod(PaymentMethod.CASH_ON_DELIVERY);

        assertThrows(BadRequestException.class, () -> orderService.createOrder("1", req));
        verify(cartPriceUpdateService, times(1)).checkAndUpdateStalePrices(1L);
        verify(orderRepository, never()).save(any());
    }

    @Test
    void P0_3_orderCancellation_preventsDoubleStockRestore() {
        Order order = new Order();
        order.setId(50L);
        order.setStatus(OrderStatus.CANCELLED);
        order.setPaymentStatus(PaymentStatus.PENDING);

        when(orderRepository.findByIdForUpdate(50L)).thenReturn(Optional.of(order));

        OrderResponse resp = orderService.updateOrderStatusForAdmin(50L, OrderStatus.CANCELLED);
        assertNotNull(resp);
        assertEquals(OrderStatus.CANCELLED, resp.getStatus());
        verify(productRepository, never()).findByIdForUpdate(any());
        verify(productRepository, never()).save(any());
    }

    @Test
    void P0_3_shippedOrder_cannotBeCancelled() {
        Order order = new Order();
        order.setId(51L);
        order.setStatus(OrderStatus.SHIPPED);

        when(orderRepository.findByIdForUpdate(51L)).thenReturn(Optional.of(order));

        assertThrows(BadRequestException.class, () -> orderService.updateOrderStatusForAdmin(51L, OrderStatus.CANCELLED));
    }
}
