package com.app.ecom;

import com.app.ecom.dto.OrderRequest;
import com.app.ecom.dto.OrderResponse;
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
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class Phase1OrderSnapshotTest {

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
    void getOrdersForUser_ProductRenamedLater_HistoricalOrderPreservesOriginalNameSnapshot() {
        User user = new User();
        user.setId(1L);

        Product product = new Product();
        product.setId(20L);
        product.setName("Changed Name"); // Admin renamed product later
        product.setPrice(new BigDecimal("30.00"));
        product.setActive(true);

        // Order created when product was named "Original Name"
        Order order = new Order();
        order.setId(800L);
        order.setUser(user);
        order.setSubtotal(new BigDecimal("25.00"));
        order.setTotalAmount(new BigDecimal("35.00"));
        order.setPaymentMethod(PaymentMethod.CASH_ON_DELIVERY);
        order.setStatus(OrderStatus.PLACED);

        OrderItem item = OrderItem.builder()
                .id(801L)
                .product(product)
                .productName("Original Name") // Snapshot
                .quantity(1)
                .unitPrice(new BigDecimal("25.00"))
                .price(new BigDecimal("25.00"))
                .order(order)
                .build();

        order.setItems(List.of(item));

        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(orderRepository.findByUserOrderByCreatedAtDesc(user)).thenReturn(List.of(order));

        List<OrderResponse> orders = orderService.getOrdersForUser("1");

        assertEquals(1, orders.size());
        assertEquals("Original Name", orders.get(0).getItems().get(0).getProductName());
        assertNotEquals("Changed Name", orders.get(0).getItems().get(0).getProductName());
    }
}
