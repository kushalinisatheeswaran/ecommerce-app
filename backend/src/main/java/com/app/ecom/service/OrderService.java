package com.app.ecom.service;

import com.app.ecom.dto.OrderItemDTO;
import com.app.ecom.dto.OrderRequest;
import com.app.ecom.dto.OrderResponse;
import com.app.ecom.exception.BadRequestException;
import com.app.ecom.model.*;
import com.app.ecom.repository.CartItemRepository;
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
    private final CartItemRepository cartItemRepository;
    private final CartPriceUpdateService cartPriceUpdateService;

    public Optional<OrderResponse> createOrder(String userId, OrderRequest request) {

        String idempotencyKey = request.getIdempotencyKey();
        if (idempotencyKey == null || idempotencyKey.isBlank()) {
            throw new BadRequestException("Idempotency key is required for checkout.");
        }
        idempotencyKey = idempotencyKey.trim();

        // 1. Un-locked pre-check & update of stale cart prices in an independent transaction BEFORE outer locks are acquired
        if (cartPriceUpdateService != null) {
            boolean stalePriceDetected = cartPriceUpdateService.checkAndUpdateStalePrices(Long.valueOf(userId));
            if (stalePriceDetected) {
                throw new BadRequestException("Price update detected: Some product prices in your cart have changed. Please review your updated total before completing order.");
            }
        }

        // 2. Lock user row to guarantee thread-safe checkout & concurrent idempotency resolution
        User user = userRepository.findByIdForUpdate(Long.valueOf(userId))
                .orElseGet(() -> userRepository.findById(Long.valueOf(userId)).orElse(null));

        if (user == null) {
            return Optional.empty();
        }

        // 3. Check for existing order with same user + idempotency key
        Optional<Order> existingOrder = orderRepository.findByUserAndIdempotencyKey(user, idempotencyKey);
        if (existingOrder.isPresent()) {
            return Optional.of(mapToOrderResponse(existingOrder.get()));
        }

        List<CartItem> cartItems = cartService.getCartEntities(userId);
        if (cartItems.isEmpty()) {
            throw new BadRequestException("Cannot create an order with an empty cart.");
        }

        // 4. Sort cart items by Product ID ascending to prevent database deadlocks across concurrent carts
        List<CartItem> sortedCartItems = cartItems.stream()
                .sorted(java.util.Comparator.comparing(item -> item.getProduct().getId()))
                .toList();

        // 5. Validate stock and build order items
        BigDecimal subtotal = BigDecimal.ZERO;
        List<OrderItem> orderItems = new java.util.ArrayList<>();

        Order order = new Order();
        order.setUser(user);
        order.setIdempotencyKey(idempotencyKey);

        for (CartItem item : sortedCartItems) {
            if (item.getQuantity() <= 0) {
                throw new BadRequestException("Invalid cart item quantity: " + item.getQuantity());
            }
            Long productId = item.getProduct().getId();
            Product product = productRepository.findByIdForUpdate(productId)
                    .orElseThrow(() -> new BadRequestException("Product not found with id: " + productId));

            if (!Boolean.TRUE.equals(product.getActive())) {
                throw new BadRequestException("Product " + product.getName() + " is no longer available.");
            }
            if (product.getStockQuantity() < item.getQuantity()) {
                throw new BadRequestException("Product " + product.getName() + " has insufficient stock (Available: " + product.getStockQuantity() + ").");
            }

            // Deduct stock atomically under lock
            product.setStockQuantity(product.getStockQuantity() - item.getQuantity());
            productRepository.save(product);

            // Latest price policy: use current product.getPrice()
            BigDecimal unitPrice = product.getPrice();
            BigDecimal lineTotal = unitPrice.multiply(BigDecimal.valueOf(item.getQuantity()));
            subtotal = subtotal.add(lineTotal);

            // Create OrderItem snapshot
            OrderItem orderItem = OrderItem.builder()
                    .product(product)
                    .productName(product.getName()) // snapshot
                    .quantity(item.getQuantity())
                    .unitPrice(unitPrice) // snapshot
                    .price(lineTotal) // snapshot
                    .order(order)
                    .build();

            orderItems.add(orderItem);
        }

        BigDecimal discountAmount = BigDecimal.ZERO;
        // Free delivery on orders over $100, else flat $10 delivery fee
        BigDecimal deliveryFee = subtotal.compareTo(new BigDecimal("100.00")) >= 0 ? BigDecimal.ZERO : new BigDecimal("10.00");
        BigDecimal codFee = request.getPaymentMethod() == PaymentMethod.CASH_ON_DELIVERY ? new BigDecimal("3.50") : BigDecimal.ZERO;

        BigDecimal totalAmount = subtotal.subtract(discountAmount).add(deliveryFee).add(codFee);

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

    public List<OrderResponse> getAllOrdersForAdmin(OrderStatus status, PaymentStatus paymentStatus) {
        List<Order> orders;
        if (status != null && paymentStatus != null) {
            orders = orderRepository.findByStatusAndPaymentStatusOrderByCreatedAtDesc(status, paymentStatus);
        } else if (status != null) {
            orders = orderRepository.findByStatusOrderByCreatedAtDesc(status);
        } else if (paymentStatus != null) {
            orders = orderRepository.findByPaymentStatusOrderByCreatedAtDesc(paymentStatus);
        } else {
            orders = orderRepository.findAllByOrderByCreatedAtDesc();
        }
        return orders.stream().map(this::mapToOrderResponse).toList();
    }

    public OrderResponse getOrderByIdForAdmin(Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new com.app.ecom.exception.ResourceNotFoundException("Order not found with id: " + orderId));
        return mapToOrderResponse(order);
    }

    public OrderResponse updateOrderStatusForAdmin(Long orderId, OrderStatus newStatus) {
        Order order = orderRepository.findByIdForUpdate(orderId)
                .orElseGet(() -> orderRepository.findById(orderId)
                        .orElseThrow(() -> new com.app.ecom.exception.ResourceNotFoundException("Order not found with id: " + orderId)));

        OrderStatus currentStatus = order.getStatus();
        if (currentStatus == newStatus) {
            return mapToOrderResponse(order);
        }

        // Validate allowed status transitions
        if (newStatus == OrderStatus.CANCELLED) {
            if (currentStatus != OrderStatus.PLACED && currentStatus != OrderStatus.PROCESSING) {
                throw new BadRequestException("Order cannot be cancelled after shipment or when already in terminal state.");
            }
            // Restore inventory safely exactly once
            for (OrderItem item : order.getItems()) {
                if (item.getProduct() != null) {
                    Long productId = item.getProduct().getId();
                    Product product = productRepository.findByIdForUpdate(productId)
                            .orElseGet(() -> productRepository.findById(productId).orElse(null));
                    if (product != null) {
                        product.setStockQuantity(product.getStockQuantity() + item.getQuantity());
                        productRepository.save(product);
                    }
                }
            }
        } else if (currentStatus == OrderStatus.PLACED) {
            if (newStatus != OrderStatus.PROCESSING && newStatus != OrderStatus.CANCELLED) {
                throw new BadRequestException("Invalid order status transition from PLACED to " + newStatus);
            }
        } else if (currentStatus == OrderStatus.PROCESSING) {
            if (newStatus != OrderStatus.SHIPPED && newStatus != OrderStatus.CANCELLED) {
                throw new BadRequestException("Invalid order status transition from PROCESSING to " + newStatus);
            }
        } else if (currentStatus == OrderStatus.SHIPPED) {
            if (newStatus != OrderStatus.DELIVERED) {
                throw new BadRequestException("Invalid order status transition from SHIPPED to " + newStatus);
            }
        } else if (currentStatus == OrderStatus.DELIVERED || currentStatus == OrderStatus.CANCELLED) {
            throw new BadRequestException("Cannot change status of a terminal order.");
        } else {
            throw new BadRequestException("Invalid order status transition.");
        }

        order.setStatus(newStatus);
        Order savedOrder = orderRepository.save(order);
        return mapToOrderResponse(savedOrder);
    }

    public OrderResponse updatePaymentStatusForAdmin(Long orderId, PaymentStatus newPaymentStatus) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new com.app.ecom.exception.ResourceNotFoundException("Order not found with id: " + orderId));

        order.setPaymentStatus(newPaymentStatus);
        Order savedOrder = orderRepository.save(order);
        return mapToOrderResponse(savedOrder);
    }

    private OrderResponse mapToOrderResponse(Order order) {
        List<OrderItemDTO> itemDtos = order.getItems() != null
                ? order.getItems().stream()
                        .map(orderItem -> {
                            String pName = orderItem.getProductName() != null
                                    ? orderItem.getProductName()
                                    : (orderItem.getProduct() != null ? orderItem.getProduct().getName() : "Product");

                            BigDecimal storedLineTotal = orderItem.getPrice();
                            int qty = orderItem.getQuantity();

                            BigDecimal derivedUnitPrice = null;
                            if (orderItem.getUnitPrice() != null) {
                                derivedUnitPrice = orderItem.getUnitPrice();
                            } else if (storedLineTotal != null && qty > 0) {
                                derivedUnitPrice = storedLineTotal.divide(BigDecimal.valueOf(qty), 2, java.math.RoundingMode.HALF_UP);
                            } else if (orderItem.getProduct() != null && orderItem.getProduct().getPrice() != null) {
                                derivedUnitPrice = orderItem.getProduct().getPrice();
                            } else {
                                derivedUnitPrice = BigDecimal.ZERO;
                            }

                            BigDecimal finalLineTotal = storedLineTotal != null
                                    ? storedLineTotal
                                    : derivedUnitPrice.multiply(BigDecimal.valueOf(qty));

                            return new OrderItemDTO(
                                    orderItem.getId(),
                                    orderItem.getProduct() != null ? orderItem.getProduct().getId() : null,
                                    pName,
                                    qty,
                                    derivedUnitPrice,
                                    finalLineTotal
                            );
                        })
                        .toList()
                : List.of();

        BigDecimal totalAmount = order.getTotalAmount() != null ? order.getTotalAmount() : BigDecimal.ZERO;

        BigDecimal subtotal;
        if (order.getSubtotal() != null) {
            subtotal = order.getSubtotal();
        } else if (!itemDtos.isEmpty()) {
            subtotal = itemDtos.stream()
                    .map(OrderItemDTO::getLineTotal)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
        } else if (order.getTotalAmount() != null) {
            subtotal = order.getTotalAmount();
        } else {
            subtotal = BigDecimal.ZERO;
        }

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

        String customerEmail = order.getUser() != null ? order.getUser().getEmail() : null;

        return new OrderResponse(
                order.getId(),
                subtotal,
                discount,
                delivery,
                cod,
                totalAmount,
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
                itemDtos,
                order.getCreatedAt(),
                customerEmail
        );
    }
}