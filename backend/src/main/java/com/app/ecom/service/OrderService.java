package com.app.ecom.service;

import com.app.ecom.dto.OrderItemDTO;
import com.app.ecom.dto.OrderRequest;
import com.app.ecom.dto.OrderResponse;
import com.app.ecom.exception.BadRequestException;
import com.app.ecom.model.*;
import com.app.ecom.repository.OrderRepository;
import com.app.ecom.repository.ProductRepository;
import com.app.ecom.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Transactional
public class OrderService {

    private final CartService cartService;
    private final UserRepository userRepository;
    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;

    public Optional<OrderResponse> createOrder(String userId, OrderRequest request) {

        List<CartItem> cartItems = cartService.getCart(userId);

        if (cartItems.isEmpty()) {
            throw new BadRequestException("Cannot create an order with an empty cart.");
        }

        Optional<User> userOptional = userRepository.findById(Long.valueOf(userId));

        if (userOptional.isEmpty()) {
            return Optional.empty();
        }

        User user = userOptional.get();

        // 1. Validate stock levels & active status
        for (CartItem item : cartItems) {
            Product product = item.getProduct();
            if (product == null || !Boolean.TRUE.equals(product.getActive())) {
                throw new BadRequestException("Product " + (product != null ? product.getName() : "Item") + " is no longer available.");
            }
            if (product.getStockQuantity() < item.getQuantity()) {
                throw new BadRequestException("Product " + product.getName() + " has insufficient stock (Available: " + product.getStockQuantity() + ").");
            }
        }

        // 2. Deduct stock levels atomically
        for (CartItem item : cartItems) {
            Product product = item.getProduct();
            product.setStockQuantity(product.getStockQuantity() - item.getQuantity());
            productRepository.save(product);
        }

        // 3. Authoritative Order Totals Calculation
        BigDecimal subtotal = cartItems.stream()
                .map(CartItem::getPrice)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal discountAmount = BigDecimal.ZERO;
        // Free delivery on orders over $100, else flat $10 delivery fee
        BigDecimal deliveryFee = subtotal.compareTo(new BigDecimal("100.00")) >= 0 ? BigDecimal.ZERO : new BigDecimal("10.00");
        BigDecimal codFee = request.getPaymentMethod() == PaymentMethod.CASH_ON_DELIVERY ? new BigDecimal("3.50") : BigDecimal.ZERO;

        BigDecimal totalAmount = subtotal.subtract(discountAmount).add(deliveryFee).add(codFee);

        Order order = new Order();
        order.setUser(user);
        order.setSubtotal(subtotal);
        order.setDiscountAmount(discountAmount);
        order.setDeliveryFee(deliveryFee);
        order.setCodFee(codFee);
        order.setTotalAmount(totalAmount);
        order.setPaymentMethod(request.getPaymentMethod());

        if (request.getPaymentMethod() == PaymentMethod.CASH_ON_DELIVERY) {
            order.setPaymentStatus(PaymentStatus.PENDING);
            order.setStatus(OrderStatus.PLACED);
        } else {
            order.setPaymentStatus(PaymentStatus.PAID_TEST);
            order.setStatus(OrderStatus.PLACED);
            order.setCardLast4(request.getCardLast4() != null ? request.getCardLast4() : "4242");
        }

        // Snapshot delivery address
        order.setShippingFullName(request.getFullName());
        order.setShippingPhone(request.getPhone());
        order.setShippingStreet(request.getStreet());
        order.setShippingCity(request.getCity());
        order.setShippingState(request.getState());
        order.setShippingZipcode(request.getZipcode());
        order.setShippingCountry(request.getCountry());

        List<OrderItem> orderItems = cartItems.stream()
                .map(item -> new OrderItem(
                        null,
                        item.getProduct(),
                        item.getQuantity(),
                        item.getPrice(),
                        order
                ))
                .toList();

        order.setItems(orderItems);

        Order savedOrder = orderRepository.save(order);

        // Clear cart after successful order creation
        cartService.clearCart(userId);

        // Update profile saved address if requested
        if (request.isSaveAddressToProfile()) {
            Address address = user.getAddress();
            if (address == null) {
                address = new Address();
            }
            address.setStreet(request.getStreet());
            address.setCity(request.getCity());
            address.setState(request.getState());
            address.setZipcode(request.getZipcode());
            address.setCountry(request.getCountry());
            user.setAddress(address);
            if (request.getPhone() != null && !request.getPhone().isBlank()) {
                user.setPhone(request.getPhone());
            }
            userRepository.save(user);
        }

        return Optional.of(mapToOrderResponse(savedOrder));
    }

    public List<OrderResponse> getOrdersForUser(String userId) {
        Optional<User> userOptional = userRepository.findById(Long.valueOf(userId));
        if (userOptional.isEmpty()) {
            return List.of();
        }
        List<Order> orders = orderRepository.findByUserOrderByCreatedAtDesc(userOptional.get());
        return orders.stream()
                .map(this::mapToOrderResponse)
                .toList();
    }

    private OrderResponse mapToOrderResponse(Order order) {
        BigDecimal subtotal = order.getSubtotal() != null ? order.getSubtotal() : order.getTotalAmount();
        BigDecimal discount = order.getDiscountAmount() != null ? order.getDiscountAmount() : BigDecimal.ZERO;
        BigDecimal delivery = order.getDeliveryFee() != null ? order.getDeliveryFee() : BigDecimal.ZERO;
        BigDecimal cod = order.getCodFee() != null ? order.getCodFee() : BigDecimal.ZERO;

        String fullName = order.getShippingFullName();
        if (fullName == null && order.getUser() != null) {
            String fName = order.getUser().getFirstName() != null ? order.getUser().getFirstName() : "";
            String lName = order.getUser().getLastName() != null ? order.getUser().getLastName() : "";
            fullName = (fName + " " + lName).trim();
        }
        String phone = order.getShippingPhone() != null ? order.getShippingPhone() : (order.getUser() != null ? order.getUser().getPhone() : "");
        String street = order.getShippingStreet();
        String city = order.getShippingCity();
        String state = order.getShippingState();
        String zipcode = order.getShippingZipcode();
        String country = order.getShippingCountry();

        if (street == null && order.getUser() != null && order.getUser().getAddress() != null) {
            Address userAddr = order.getUser().getAddress();
            street = userAddr.getStreet();
            city = userAddr.getCity();
            state = userAddr.getState();
            zipcode = userAddr.getZipcode();
            country = userAddr.getCountry();
        }

        return new OrderResponse(
                order.getId(),
                subtotal,
                discount,
                delivery,
                cod,
                order.getTotalAmount(),
                order.getStatus(),
                order.getPaymentMethod() != null ? order.getPaymentMethod() : PaymentMethod.CASH_ON_DELIVERY,
                order.getPaymentStatus() != null ? order.getPaymentStatus() : PaymentStatus.PENDING,
                order.getCardLast4(),
                fullName,
                phone,
                street,
                city,
                state,
                zipcode,
                country,
                order.getItems().stream()
                        .map(orderItem -> new OrderItemDTO(
                                orderItem.getId(),
                                orderItem.getProduct().getId(),
                                orderItem.getQuantity(),
                                orderItem.getPrice(),
                                orderItem.getPrice()
                                        .multiply(BigDecimal.valueOf(orderItem.getQuantity()))
                        ))
                        .toList(),
                order.getCreatedAt()
        );
    }
}