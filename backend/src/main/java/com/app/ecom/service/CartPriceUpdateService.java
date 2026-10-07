package com.app.ecom.service;

import com.app.ecom.model.CartItem;
import com.app.ecom.model.Product;
import com.app.ecom.model.User;
import com.app.ecom.repository.CartItemRepository;
import com.app.ecom.repository.ProductRepository;
import com.app.ecom.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CartPriceUpdateService {

    private final CartItemRepository cartItemRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public boolean checkAndUpdateStalePrices(Long userId) {
        User user = userRepository.findById(userId).orElse(null);
        if (user == null) return false;
        
        List<CartItem> cartItems = cartItemRepository.findByUser(user);
        boolean priceChanged = false;
        for (CartItem item : cartItems) {
            if (item == null || item.getProduct() == null) continue;

            Product product = productRepository.findById(item.getProduct().getId()).orElse(null);
            if (product == null) continue;

            if (item.getUnitPrice() != null && item.getUnitPrice().compareTo(product.getPrice()) != 0) {
                priceChanged = true;
                item.setUnitPrice(product.getPrice());
                item.setPrice(product.getPrice().multiply(BigDecimal.valueOf(item.getQuantity())));
                cartItemRepository.save(item);
            }
        }
        return priceChanged;
    }
}
