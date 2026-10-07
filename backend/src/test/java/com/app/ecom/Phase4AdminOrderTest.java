package com.app.ecom;

import com.app.ecom.dto.OrderItemDTO;
import com.app.ecom.dto.OrderResponse;
import com.app.ecom.exception.BadRequestException;
import com.app.ecom.model.*;
import com.app.ecom.repository.OrderRepository;
import com.app.ecom.repository.ProductRepository;
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
class Phase4AdminOrderTest {

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private ProductRepository productRepository;

    @InjectMocks
    private OrderService orderService;

    @Test
    void A_adminCanRetrieveAllOrders() {
        Order order = new Order();
        order.setId(10L);
        order.setStatus(OrderStatus.PLACED);

        when(orderRepository.findAllByOrderByCreatedAtDesc()).thenReturn(List.of(order));

        List<OrderResponse> result = orderService.getAllOrdersForAdmin(null, null);
        assertEquals(1, result.size());
        assertEquals(10L, result.get(0).getId());
    }

    @Test
    void C_placedToProcessingSucceeds() {
        Order order = new Order();
        order.setId(10L);
        order.setStatus(OrderStatus.PLACED);

        when(orderRepository.findById(10L)).thenReturn(Optional.of(order));
        when(orderRepository.save(any(Order.class))).thenAnswer(invocation -> invocation.getArgument(0));

        OrderResponse res = orderService.updateOrderStatusForAdmin(10L, OrderStatus.PROCESSING);
        assertEquals(OrderStatus.PROCESSING, res.getStatus());
    }

    @Test
    void D_processingToShippedSucceeds() {
        Order order = new Order();
        order.setId(10L);
        order.setStatus(OrderStatus.PROCESSING);

        when(orderRepository.findById(10L)).thenReturn(Optional.of(order));
        when(orderRepository.save(any(Order.class))).thenAnswer(invocation -> invocation.getArgument(0));

        OrderResponse res = orderService.updateOrderStatusForAdmin(10L, OrderStatus.SHIPPED);
        assertEquals(OrderStatus.SHIPPED, res.getStatus());
    }

    @Test
    void E_shippedToDeliveredSucceeds() {
        Order order = new Order();
        order.setId(10L);
        order.setStatus(OrderStatus.SHIPPED);

        when(orderRepository.findById(10L)).thenReturn(Optional.of(order));
        when(orderRepository.save(any(Order.class))).thenAnswer(invocation -> invocation.getArgument(0));

        OrderResponse res = orderService.updateOrderStatusForAdmin(10L, OrderStatus.DELIVERED);
        assertEquals(OrderStatus.DELIVERED, res.getStatus());
    }

    @Test
    void F_invalidBackwardTransitionIsRejected() {
        Order order = new Order();
        order.setId(10L);
        order.setStatus(OrderStatus.SHIPPED);

        when(orderRepository.findById(10L)).thenReturn(Optional.of(order));

        assertThrows(BadRequestException.class, () -> {
            orderService.updateOrderStatusForAdmin(10L, OrderStatus.PROCESSING);
        });
    }

    @Test
    void G_H_placedToCancelledRestoresProductStock() {
        Product product = new Product();
        product.setId(5L);
        product.setStockQuantity(10);

        Order order = new Order();
        order.setId(10L);
        order.setStatus(OrderStatus.PLACED);

        OrderItem item = OrderItem.builder()
                .id(1L)
                .product(product)
                .quantity(2)
                .order(order)
                .build();
        order.setItems(List.of(item));

        when(orderRepository.findById(10L)).thenReturn(Optional.of(order));
        when(productRepository.findByIdForUpdate(5L)).thenReturn(Optional.of(product));
        when(orderRepository.save(any(Order.class))).thenAnswer(invocation -> invocation.getArgument(0));

        OrderResponse res = orderService.updateOrderStatusForAdmin(10L, OrderStatus.CANCELLED);
        assertEquals(OrderStatus.CANCELLED, res.getStatus());
        assertEquals(12, product.getStockQuantity());
    }

    @Test
    void I_cancellingTwiceDoesNotRestoreStockTwice() {
        Product product = new Product();
        product.setId(5L);
        product.setStockQuantity(12);

        Order order = new Order();
        order.setId(10L);
        order.setStatus(OrderStatus.CANCELLED);

        OrderItem item = OrderItem.builder()
                .id(1L)
                .product(product)
                .quantity(2)
                .order(order)
                .build();
        order.setItems(List.of(item));

        when(orderRepository.findById(10L)).thenReturn(Optional.of(order));

        OrderResponse res = orderService.updateOrderStatusForAdmin(10L, OrderStatus.CANCELLED);
        assertEquals(OrderStatus.CANCELLED, res.getStatus());
        assertEquals(12, product.getStockQuantity()); // Stock unchanged
        verify(productRepository, never()).save(any());
    }

    @Test
    void J_shippedOrderCannotBeCancelled() {
        Order order = new Order();
        order.setId(10L);
        order.setStatus(OrderStatus.SHIPPED);

        when(orderRepository.findById(10L)).thenReturn(Optional.of(order));

        assertThrows(BadRequestException.class, () -> {
            orderService.updateOrderStatusForAdmin(10L, OrderStatus.CANCELLED);
        });
    }

    @Test
    void K_codPaymentCanMovePendingToPaid() {
        Order order = new Order();
        order.setId(10L);
        order.setPaymentStatus(PaymentStatus.PENDING);

        when(orderRepository.findById(10L)).thenReturn(Optional.of(order));
        when(orderRepository.save(any(Order.class))).thenAnswer(invocation -> invocation.getArgument(0));

        OrderResponse res = orderService.updatePaymentStatusForAdmin(10L, PaymentStatus.PAID_TEST);
        assertEquals(PaymentStatus.PAID_TEST, res.getPaymentStatus());
    }

    @Test
    void M_legacyFallback_UnitPriceDerivedFromStoredLineTotalWhenUnitPriceNull() {
        // A. unitPrice null + stored lineTotal present -> unitPrice derived from lineTotal / quantity
        Product product = new Product();
        product.setId(50L);
        product.setPrice(new BigDecimal("99.99")); // Catalog price changed since old order

        Order legacyOrder = new Order();
        legacyOrder.setId(88L);
        legacyOrder.setUser(new User());

        OrderItem item = OrderItem.builder()
                .id(888L)
                .product(product)
                .quantity(2)
                .unitPrice(null)
                .price(new BigDecimal("50.00")) // Stored line total
                .order(legacyOrder)
                .build();
        legacyOrder.setItems(List.of(item));

        when(orderRepository.findById(88L)).thenReturn(Optional.of(legacyOrder));

        OrderResponse res = orderService.getOrderByIdForAdmin(88L);
        assertEquals(new BigDecimal("25.00"), res.getItems().get(0).getUnitPrice());
        assertEquals(new BigDecimal("50.00"), res.getItems().get(0).getLineTotal());
    }

    @Test
    void N_legacyFallback_ProductPriceUsedOnlyAsFinalFallbackWhenUnitPriceAndLineTotalNull() {
        // B. unitPrice null + lineTotal null + Product.price present -> Product.price used only as final fallback
        Product product = new Product();
        product.setId(50L);
        product.setPrice(new BigDecimal("30.00"));

        Order legacyOrder = new Order();
        legacyOrder.setId(89L);
        legacyOrder.setUser(new User());

        OrderItem item = OrderItem.builder()
                .id(889L)
                .product(product)
                .quantity(3)
                .unitPrice(null)
                .price(null)
                .order(legacyOrder)
                .build();
        legacyOrder.setItems(List.of(item));

        when(orderRepository.findById(89L)).thenReturn(Optional.of(legacyOrder));

        OrderResponse res = orderService.getOrderByIdForAdmin(89L);
        assertEquals(new BigDecimal("30.00"), res.getItems().get(0).getUnitPrice());
        assertEquals(new BigDecimal("90.00"), res.getItems().get(0).getLineTotal());
    }

    @Test
    void O_legacyFallback_SubtotalDerivedFromMappedOrderItemsWhenSubtotalNull() {
        // C. subtotal null + valid order-item line totals -> subtotal derived from item totals
        Order legacyOrder = new Order();
        legacyOrder.setId(90L);
        legacyOrder.setUser(new User());
        legacyOrder.setSubtotal(null);
        legacyOrder.setTotalAmount(new BigDecimal("100.00"));

        OrderItem item1 = OrderItem.builder()
                .id(901L)
                .quantity(1)
                .unitPrice(new BigDecimal("20.00"))
                .price(new BigDecimal("20.00"))
                .order(legacyOrder)
                .build();

        OrderItem item2 = OrderItem.builder()
                .id(902L)
                .quantity(1)
                .unitPrice(new BigDecimal("30.00"))
                .price(new BigDecimal("30.00"))
                .order(legacyOrder)
                .build();

        legacyOrder.setItems(List.of(item1, item2));

        when(orderRepository.findById(90L)).thenReturn(Optional.of(legacyOrder));

        OrderResponse res = orderService.getOrderByIdForAdmin(90L);
        assertEquals(new BigDecimal("50.00"), res.getSubtotal());
        assertEquals(new BigDecimal("100.00"), res.getTotalAmount());
    }

    @Test
    void P_modernOrderSnapshotValues_RemainUnchanged() {
        // D. modern order snapshot values remain unchanged
        Product product = new Product();
        product.setId(50L);
        product.setPrice(new BigDecimal("999.00")); // Changed catalog price

        Order modernOrder = new Order();
        modernOrder.setId(91L);
        modernOrder.setUser(new User());
        modernOrder.setSubtotal(new BigDecimal("100.00"));
        modernOrder.setTotalAmount(new BigDecimal("115.00"));
        modernOrder.setDiscountAmount(new BigDecimal("10.00"));
        modernOrder.setDeliveryFee(new BigDecimal("20.00"));
        modernOrder.setCodFee(new BigDecimal("5.00"));

        OrderItem modernItem = OrderItem.builder()
                .id(911L)
                .product(product)
                .productName("Snapshot Name")
                .quantity(2)
                .unitPrice(new BigDecimal("55.00"))
                .price(new BigDecimal("110.00"))
                .order(modernOrder)
                .build();
        modernOrder.setItems(List.of(modernItem));

        when(orderRepository.findById(91L)).thenReturn(Optional.of(modernOrder));

        OrderResponse res = orderService.getOrderByIdForAdmin(91L);
        assertEquals(new BigDecimal("100.00"), res.getSubtotal());
        assertEquals(new BigDecimal("115.00"), res.getTotalAmount());
        assertEquals(new BigDecimal("10.00"), res.getDiscountAmount());
        assertEquals(new BigDecimal("20.00"), res.getDeliveryFee());
        assertEquals(new BigDecimal("5.00"), res.getCodFee());

        OrderItemDTO mappedItem = res.getItems().get(0);
        assertEquals("Snapshot Name", mappedItem.getProductName());
        assertEquals(new BigDecimal("55.00"), mappedItem.getUnitPrice());
        assertEquals(new BigDecimal("110.00"), mappedItem.getLineTotal());
    }
}
