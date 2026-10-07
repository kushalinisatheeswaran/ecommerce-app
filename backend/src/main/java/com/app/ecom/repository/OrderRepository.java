package com.app.ecom.repository;

import com.app.ecom.model.Order;
import com.app.ecom.model.OrderStatus;
import com.app.ecom.model.PaymentStatus;
import com.app.ecom.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {
    List<Order> findByUserOrderByCreatedAtDesc(User user);
    Optional<Order> findByUserAndIdempotencyKey(User user, String idempotencyKey);
    
    List<Order> findAllByOrderByCreatedAtDesc();
    List<Order> findByStatusOrderByCreatedAtDesc(OrderStatus status);
    List<Order> findByPaymentStatusOrderByCreatedAtDesc(PaymentStatus paymentStatus);
    List<Order> findByStatusAndPaymentStatusOrderByCreatedAtDesc(OrderStatus status, PaymentStatus paymentStatus);
}

