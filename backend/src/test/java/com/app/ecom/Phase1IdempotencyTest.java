package com.app.ecom;

import com.app.ecom.dto.OrderRequest;
import com.app.ecom.dto.OrderResponse;
import com.app.ecom.exception.BadRequestException;
import com.app.ecom.model.*;
import com.app.ecom.repository.OrderRepository;
import com.app.ecom.repository.ProductRepository;
import com.app.ecom.repository.UserRepository;
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
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.locks.ReentrantLock;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class Phase1IdempotencyTest {

    @Mock
    private CartService cartService;
    @Mock
    private UserRepository userRepository;
    @Mock
    private OrderRepository orderRepository;
    @Mock
    private ProductRepository productRepository;

    @InjectMocks
    private OrderService orderService;

    private User user;
    private Product product;
    private CartItem cartItem;
    private OrderRequest request;

    @BeforeEach
    void setUp() {
        user = new User();
        user.setId(1L);

        product = new Product();
        product.setId(10L);
        product.setName("Widget");
        product.setPrice(new BigDecimal("20.00"));
        product.setStockQuantity(10);
        product.setActive(true);

        cartItem = CartItem.builder()
                .id(100L)
                .user(user)
                .product(product)
                .quantity(2)
                .unitPrice(new BigDecimal("20.00"))
                .price(new BigDecimal("40.00"))
                .build();

        request = new OrderRequest();
        request.setPaymentMethod(PaymentMethod.CASH_ON_DELIVERY);
        request.setFullName("John Doe");
        request.setPhone("1234567890");
        request.setStreet("Main St");
        request.setCity("City");
        request.setState("State");
        request.setZipcode("12345");
        request.setCountry("Country");
    }

    @Test
    void createOrder_MissingOrBlankKey_ThrowsBadRequestException() {
        request.setIdempotencyKey(null);
        assertThrows(BadRequestException.class, () -> orderService.createOrder("1", request));

        request.setIdempotencyKey("   ");
        assertThrows(BadRequestException.class, () -> orderService.createOrder("1", request));
    }

    @Test
    void createOrder_RepeatedSameKey_ReturnsOriginalOrderWithoutCreatingSecond() {
        request.setIdempotencyKey("idem-key-123");

        Order existingOrder = new Order();
        existingOrder.setId(500L);
        existingOrder.setUser(user);
        existingOrder.setIdempotencyKey("idem-key-123");
        existingOrder.setSubtotal(new BigDecimal("40.00"));
        existingOrder.setTotalAmount(new BigDecimal("53.50"));

        when(userRepository.findByIdForUpdate(1L)).thenReturn(Optional.of(user));
        when(orderRepository.findByUserAndIdempotencyKey(user, "idem-key-123"))
                .thenReturn(Optional.of(existingOrder));

        Optional<OrderResponse> response = orderService.createOrder("1", request);

        assertTrue(response.isPresent());
        assertEquals(500L, response.get().getId());
        verify(productRepository, never()).findByIdForUpdate(anyLong());
        verify(orderRepository, never()).save(any(Order.class));
        verify(cartService, never()).clearCart(anyString());
    }

    @Test
    void createOrder_FirstRequest_CreatesOrderAndStoresKey() {
        request.setIdempotencyKey("idem-key-456");

        when(userRepository.findByIdForUpdate(1L)).thenReturn(Optional.of(user));
        when(orderRepository.findByUserAndIdempotencyKey(user, "idem-key-456"))
                .thenReturn(Optional.empty());
        when(cartService.getCartEntities("1")).thenReturn(List.of(cartItem));
        when(productRepository.findByIdForUpdate(10L)).thenReturn(Optional.of(product));
        when(orderRepository.save(any(Order.class))).thenAnswer(invocation -> {
            Order o = invocation.getArgument(0);
            o.setId(501L);
            return o;
        });

        Optional<OrderResponse> response = orderService.createOrder("1", request);

        assertTrue(response.isPresent());
        assertEquals(501L, response.get().getId());
        verify(orderRepository, times(1)).save(argThat(o -> "idem-key-456".equals(o.getIdempotencyKey())));
    }

    @Test
    void concurrentSameKeyRequests_CreatesExactlyOneOrder_ReturnsSameLogicalOrder() throws Exception {
        request.setIdempotencyKey("concurrent-key-999");

        ReentrantLock userLock = new ReentrantLock();
        Order savedOrderRef[] = new Order[1];

        when(userRepository.findByIdForUpdate(1L)).thenAnswer(inv -> {
            userLock.lock();
            return Optional.of(user);
        });

        when(orderRepository.findByUserAndIdempotencyKey(user, "concurrent-key-999")).thenAnswer(inv -> {
            return Optional.ofNullable(savedOrderRef[0]);
        });

        when(cartService.getCartEntities("1")).thenAnswer(inv -> {
            if (savedOrderRef[0] != null) return List.of();
            return List.of(cartItem);
        });

        when(productRepository.findByIdForUpdate(10L)).thenReturn(Optional.of(product));

        when(orderRepository.save(any(Order.class))).thenAnswer(inv -> {
            Order o = inv.getArgument(0);
            o.setId(777L);
            savedOrderRef[0] = o;
            return o;
        });

        ExecutorService executor = Executors.newFixedThreadPool(2);
        CountDownLatch startLatch = new CountDownLatch(1);
        CountDownLatch finishLatch = new CountDownLatch(2);

        OrderResponse[] results = new OrderResponse[2];
        AtomicInteger successCount = new AtomicInteger(0);

        for (int i = 0; i < 2; i++) {
            final int index = i;
            executor.submit(() -> {
                try {
                    startLatch.await();
                    Optional<OrderResponse> res = orderService.createOrder("1", request);
                    if (res.isPresent()) {
                        results[index] = res.get();
                        successCount.incrementAndGet();
                    }
                } catch (Exception ex) {
                    ex.printStackTrace();
                } finally {
                    if (userLock.isHeldByCurrentThread()) {
                        userLock.unlock();
                    }
                    finishLatch.countDown();
                }
            });
        }

        startLatch.countDown();
        finishLatch.await();
        executor.shutdown();

        assertEquals(2, successCount.get(), "Both concurrent calls with same key return order");
        assertEquals(777L, results[0].getId());
        assertEquals(777L, results[1].getId());
        assertEquals(8, product.getStockQuantity(), "Stock deducted only once for qty=2 from initial 10");
        verify(orderRepository, times(1)).save(any(Order.class));
    }
}
