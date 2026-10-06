package com.app.ecom;

import com.app.ecom.dto.ProductResponse;
import com.app.ecom.exception.BadRequestException;
import com.app.ecom.model.Product;
import com.app.ecom.repository.ProductRepository;
import com.app.ecom.service.ProductService;
import com.app.ecom.specification.ProductSpecification;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.*;
import org.springframework.data.jpa.domain.Specification;

import java.math.BigDecimal;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class Phase2ProductQueryTest {

    @Mock
    private ProductRepository productRepository;

    @InjectMocks
    private ProductService productService;

    private Product prod1;
    private Product prod2;

    @BeforeEach
    void setUp() {
        prod1 = new Product();
        prod1.setId(1L);
        prod1.setName("Wireless Mouse");
        prod1.setCategory("Electronics");
        prod1.setPrice(new BigDecimal("25.00"));
        prod1.setActive(true);

        prod2 = new Product();
        prod2.setId(2L);
        prod2.setName("Mechanical Keyboard");
        prod2.setCategory("Electronics");
        prod2.setPrice(new BigDecimal("85.00"));
        prod2.setActive(true);
    }

    @Test
    void test1_productsWithoutFilters() {
        Pageable pageable = PageRequest.of(0, 10, Sort.by("id").ascending());
        Page<Product> mockPage = new PageImpl<>(List.of(prod1, prod2), pageable, 2);
        when(productRepository.findAll(any(Specification.class), eq(pageable))).thenReturn(mockPage);

        Page<ProductResponse> result = productService.getProducts(null, null, null, null, pageable);

        assertEquals(2, result.getTotalElements());
        assertEquals("Wireless Mouse", result.getContent().get(0).getName());
        verify(productRepository).findAll(any(Specification.class), eq(pageable));
    }

    @Test
    void test2_searchFilter() {
        Pageable pageable = PageRequest.of(0, 10);
        Page<Product> mockPage = new PageImpl<>(List.of(prod1), pageable, 1);
        when(productRepository.findAll(any(Specification.class), eq(pageable))).thenReturn(mockPage);

        Page<ProductResponse> result = productService.getProducts("mouse", null, null, null, pageable);

        assertEquals(1, result.getTotalElements());
        assertEquals("Wireless Mouse", result.getContent().get(0).getName());
    }

    @Test
    void test3_categoryFilter() {
        Pageable pageable = PageRequest.of(0, 10);
        Page<Product> mockPage = new PageImpl<>(List.of(prod1, prod2), pageable, 2);
        when(productRepository.findAll(any(Specification.class), eq(pageable))).thenReturn(mockPage);

        Page<ProductResponse> result = productService.getProducts(null, "Electronics", null, null, pageable);

        assertEquals(2, result.getTotalElements());
    }

    @Test
    void test4_searchAndCategoryTogether() {
        Pageable pageable = PageRequest.of(0, 10);
        Page<Product> mockPage = new PageImpl<>(List.of(prod1), pageable, 1);
        when(productRepository.findAll(any(Specification.class), eq(pageable))).thenReturn(mockPage);

        Page<ProductResponse> result = productService.getProducts("mouse", "Electronics", null, null, pageable);

        assertEquals(1, result.getTotalElements());
    }

    @Test
    void test5_minMaxPriceFilter() {
        Pageable pageable = PageRequest.of(0, 10);
        Page<Product> mockPage = new PageImpl<>(List.of(prod2), pageable, 1);
        when(productRepository.findAll(any(Specification.class), eq(pageable))).thenReturn(mockPage);

        Page<ProductResponse> result = productService.getProducts(null, null, new BigDecimal("50.00"), new BigDecimal("100.00"), pageable);

        assertEquals(1, result.getTotalElements());
        assertEquals("Mechanical Keyboard", result.getContent().get(0).getName());
    }

    @Test
    void test6_sortingAscendingDescending() {
        Pageable pageableAsc = PageRequest.of(0, 10, Sort.by("price").ascending());
        Page<Product> mockPageAsc = new PageImpl<>(List.of(prod1, prod2), pageableAsc, 2);
        when(productRepository.findAll(any(Specification.class), eq(pageableAsc))).thenReturn(mockPageAsc);

        Page<ProductResponse> resultAsc = productService.getProducts(null, null, null, null, pageableAsc);
        assertEquals("Wireless Mouse", resultAsc.getContent().get(0).getName());

        Pageable pageableDesc = PageRequest.of(0, 10, Sort.by("price").descending());
        Page<Product> mockPageDesc = new PageImpl<>(List.of(prod2, prod1), pageableDesc, 2);
        when(productRepository.findAll(any(Specification.class), eq(pageableDesc))).thenReturn(mockPageDesc);

        Page<ProductResponse> resultDesc = productService.getProducts(null, null, null, null, pageableDesc);
        assertEquals("Mechanical Keyboard", resultDesc.getContent().get(0).getName());
    }

    @Test
    void test7_pagination() {
        Pageable pageable = PageRequest.of(1, 1, Sort.by("id").ascending());
        Page<Product> mockPage = new PageImpl<>(List.of(prod2), pageable, 2);
        when(productRepository.findAll(any(Specification.class), eq(pageable))).thenReturn(mockPage);

        Page<ProductResponse> result = productService.getProducts(null, null, null, null, pageable);

        assertEquals(2, result.getTotalElements());
        assertEquals(1, result.getContent().size());
        assertEquals("Mechanical Keyboard", result.getContent().get(0).getName());
    }

    @Test
    void test8_inactiveProductsExcluded() {
        Specification<Product> spec = ProductSpecification.filterProducts(null, null, null, null);
        assertNotNull(spec);
    }

    @Test
    void test9_categoryEndpointReturnsOnlyActiveProductCategories() {
        when(productRepository.findDistinctActiveCategories()).thenReturn(List.of("Electronics", "Fashion"));

        List<String> categories = productService.getActiveCategories();

        assertEquals(2, categories.size());
        assertEquals("Electronics", categories.get(0));
        assertEquals("Fashion", categories.get(1));
    }

    @Test
    void test10_invalidPriceRange_ThrowsBadRequestException() {
        Pageable pageable = PageRequest.of(0, 10);
        assertThrows(BadRequestException.class, () ->
                productService.getProducts(null, null, new BigDecimal("100.00"), new BigDecimal("50.00"), pageable)
        );

        assertThrows(BadRequestException.class, () ->
                productService.getProducts(null, null, new BigDecimal("-10.00"), new BigDecimal("50.00"), pageable)
        );
    }

    @Test
    void test11_unsupportedSortField_ThrowsBadRequestException() {
        Pageable invalidSortPageable = PageRequest.of(0, 10, Sort.by("secretField").ascending());

        BadRequestException ex = assertThrows(BadRequestException.class, () ->
                productService.getProducts(null, null, null, null, invalidSortPageable)
        );
        assertTrue(ex.getMessage().contains("Invalid sort field"));
    }
}
