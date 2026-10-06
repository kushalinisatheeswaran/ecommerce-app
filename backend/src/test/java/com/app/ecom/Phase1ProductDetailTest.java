package com.app.ecom;

import com.app.ecom.dto.ProductResponse;
import com.app.ecom.exception.ResourceNotFoundException;
import com.app.ecom.model.Product;
import com.app.ecom.repository.ProductRepository;
import com.app.ecom.service.ProductService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class Phase1ProductDetailTest {

    @Mock
    private ProductRepository productRepository;

    @InjectMocks
    private ProductService productService;

    @Test
    void getProductById_ExistingActiveProduct_ReturnsProductResponse() {
        Product product = new Product();
        product.setId(5L);
        product.setName("Active Gizmo");
        product.setCategory("Gadgets");
        product.setPrice(new BigDecimal("99.99"));
        product.setStockQuantity(15);
        product.setActive(true);

        when(productRepository.findById(5L)).thenReturn(Optional.of(product));

        ProductResponse response = productService.getProductById(5L);

        assertNotNull(response);
        assertEquals(5L, response.getId());
        assertEquals("Active Gizmo", response.getName());
        assertTrue(response.getActive());
    }

    @Test
    void getProductById_MissingProduct_ThrowsResourceNotFoundException() {
        when(productRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> productService.getProductById(999L));
    }

    @Test
    void getProductById_InactiveProduct_ThrowsResourceNotFoundException() {
        Product inactiveProduct = new Product();
        inactiveProduct.setId(6L);
        inactiveProduct.setName("Hidden Item");
        inactiveProduct.setActive(false);

        when(productRepository.findById(6L)).thenReturn(Optional.of(inactiveProduct));

        assertThrows(ResourceNotFoundException.class, () -> productService.getProductById(6L));
    }
}
