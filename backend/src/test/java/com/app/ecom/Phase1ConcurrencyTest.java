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
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.ArrayList;
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
class Phase1ConcurrencyTest {

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

    @Test
    void concurrentCheckout_InitialStockOne_ExactlyOneSucceeds() throws Exception {
        User user1 = new User();
        user1.setId(1L);

        User user2 = new User();
        user2.setId(2L);

        Product product = new Product();
        product.setId(100L);
        product.setName("Limited Item");
        product.setPrice(new BigDecimal("50.00"));
        product.setStockQuantity(1);
        product.setActive(true);

        CartItem cartItem1 = CartItem.builder()
                .id(10L)
                .user(user1)
                .product(product)
                .quantity(1)
                .unitPrice(new BigDecimal("50.00"))
                .price(new BigDecimal("50.00"))
                .build();

        CartItem cartItem2 = CartItem.builder()
                .id(11L)
                .user(user2)
                .product(product)
                .quantity(1)
                .unitPrice(new BigDecimal("50.00"))
                .price(new BigDecimal("50.00"))
                .build();

        when(userRepository.findByIdForUpdate(1L)).thenReturn(Optional.of(user1));
        when(userRepository.findByIdForUpdate(2L)).thenReturn(Optional.of(user2));
        when(cartService.getCartEntities("1")).thenReturn(List.of(cartItem1));
        when(cartService.getCartEntities("2")).thenReturn(List.of(cartItem2));

        ReentrantLock lock = new ReentrantLock();

        when(productRepository.findByIdForUpdate(100L)).thenAnswer(invocation -> {
            lock.lock();
            Product p = new Product();
            p.setId(product.getId());
            p.setName(product.getName());
            p.setPrice(product.getPrice());
            p.setStockQuantity(product.getStockQuantity());
            p.setActive(product.getActive());
            return Optional.of(p);
        });

        when(productRepository.save(any(Product.class))).thenAnswer(invocation -> {
            Product saved = invocation.getArgument(0);
            product.setStockQuantity(saved.getStockQuantity());
            if (lock.isHeldByCurrentThread()) {
                lock.unlock();
            }
            return saved;
        });

        when(orderRepository.save(any(Order.class))).thenAnswer(invocation -> {
            Order o = invocation.getArgument(0);
            o.setId(1001L);
            return o;
        });

        OrderRequest request1 = new OrderRequest();
        request1.setIdempotencyKey("key-user1");
        request1.setPaymentMethod(PaymentMethod.CASH_ON_DELIVERY);
        request1.setFullName("John Doe");
        request1.setPhone("1234567890");
        request1.setStreet("Main St");
        request1.setCity("City");
        request1.setState("State");
        request1.setZipcode("12345");
        request1.setCountry("Country");

        OrderRequest request2 = new OrderRequest();
        request2.setIdempotencyKey("key-user2");
        request2.setPaymentMethod(PaymentMethod.CASH_ON_DELIVERY);
        request2.setFullName("Jane Smith");
        request2.setPhone("0987654321");
        request2.setStreet("Second St");
        request2.setCity("City");
        request2.setState("State");
        request2.setZipcode("54321");
        request2.setCountry("Country");

        AtomicInteger successCount = new AtomicInteger(0);
        AtomicInteger failCount = new AtomicInteger(0);

        ExecutorService executor = Executors.newFixedThreadPool(2);
        CountDownLatch startLatch = new CountDownLatch(1);
        CountDownLatch finishLatch = new CountDownLatch(2);

        executor.submit(() -> {
            try {
                startLatch.await();
                Optional<OrderResponse> res = orderService.createOrder("1", request1);
                if (res.isPresent()) successCount.incrementAndGet();
            } catch (BadRequestException ex) {
                failCount.incrementAndGet();
            } catch (Exception ex) {
                ex.printStackTrace();
            } finally {
                if (lock.isHeldByCurrentThread()) lock.unlock();
                finishLatch.countDown();
            }
        });

        executor.submit(() -> {
            try {
                startLatch.await();
                Optional<OrderResponse> res = orderService.createOrder("2", request2);
                if (res.isPresent()) successCount.incrementAndGet();
            } catch (BadRequestException ex) {
                failCount.incrementAndGet();
            } catch (Exception ex) {
                ex.printStackTrace();
            } finally {
                if (lock.isHeldByCurrentThread()) lock.unlock();
                finishLatch.countDown();
            }
        });

        startLatch.countDown();
        finishLatch.await();
        executor.shutdown();

        assertEquals(1, successCount.get(), "Exactly one checkout must succeed");
        assertEquals(1, failCount.get(), "Exactly one checkout must fail cleanly due to stock");
        assertEquals(0, product.getStockQuantity(), "Final stock must be 0 and never negative");
    }

    @Test
    void multiProductCart_LocksProductsInAscendingIdOrder_PreventsDeadlock() {
        User user = new User();
        user.setId(1L);

        Product product1 = new Product();
        product1.setId(10L);
        product1.setName("Product 10");
        product1.setPrice(new BigDecimal("15.00"));
        product1.setStockQuantity(5);
        product1.setActive(true);

        Product product2 = new Product();
        product2.setId(20L);
        product2.setName("Product 20");
        product2.setPrice(new BigDecimal("25.00"));
        product2.setStockQuantity(5);
        product2.setActive(true);

        // Cart items deliberately placed in descending order (20 then 10)
        CartItem cartItem20 = CartItem.builder().id(100L).user(user).product(product2).quantity(1).unitPrice(new BigDecimal("25.00")).price(new BigDecimal("25.00")).build();
        CartItem cartItem10 = CartItem.builder().id(101L).user(user).product(product1).quantity(1).unitPrice(new BigDecimal("15.00")).price(new BigDecimal("15.00")).build();

        List<Long> lockAcquisitionOrder = new ArrayList<>();

        when(userRepository.findByIdForUpdate(1L)).thenReturn(Optional.of(user));
        when(cartService.getCartEntities("1")).thenReturn(List.of(cartItem20, cartItem10));

        when(productRepository.findByIdForUpdate(anyLong())).thenAnswer(invocation -> {
            Long id = invocation.getArgument(0);
            lockAcquisitionOrder.add(id);
            if (id.equals(10L)) return Optional.of(product1);
            if (id.equals(20L)) return Optional.of(product2);
            return Optional.empty();
        });

        when(orderRepository.save(any(Order.class))).thenAnswer(inv -> {
            Order o = inv.getArgument(0);
            o.setId(99L);
            return o;
        });

        OrderRequest request = new OrderRequest();
        request.setIdempotencyKey("sort-lock-key");
        request.setPaymentMethod(PaymentMethod.CASH_ON_DELIVERY);
        request.setFullName("Lock Tester");
        request.setPhone("1234567890");
        request.setStreet("Street");
        request.setCity("City");
        request.setState("State");
        request.setZipcode("12345");
        request.setCountry("Country");

        orderService.createOrder("1", request);

        // Verify product 10 was locked BEFORE product 20 despite cart item insertion order
        assertTrue(lockAcquisitionOrder.size() >= 2);
        assertEquals(10L, lockAcquisitionOrder.get(0), "Product 10 MUST be locked first (ascending ID order)");
        assertEquals(20L, lockAcquisitionOrder.get(1), "Product 20 MUST be locked second (ascending ID order)");
    }
}
