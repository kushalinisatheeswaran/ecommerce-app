package com.app.ecom.service;

import com.app.ecom.dto.ProductRequest;
import com.app.ecom.dto.ProductResponse;
import com.app.ecom.exception.BadRequestException;
import com.app.ecom.exception.ResourceNotFoundException;
import com.app.ecom.model.Product;
import com.app.ecom.repository.ProductRepository;
import com.app.ecom.specification.ProductSpecification;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProductService {

    private final ProductRepository productRepository;
    private static final Set<String> ALLOWED_SORT_FIELDS = Set.of("id", "name", "price", "createdAt", "category");

    public ProductResponse createProduct(ProductRequest productRequest) {

        Product product = new Product();

        updateProductFromRequest(product, productRequest);

        Product savedProduct = productRepository.save(product);

        return mapToProductResponse(savedProduct);
    }

    private void updateProductFromRequest(Product product, ProductRequest request) {
        product.setName(request.getName());
        product.setCategory(request.getCategory());
        product.setDescription(request.getDescription());
        product.setPrice(request.getPrice());
        product.setImageUrl(request.getImageUrl());
        product.setStockQuantity(request.getStockQuantity());
        product.setActive(true);
    }

    private ProductResponse mapToProductResponse(Product savedProduct) {

        ProductResponse response = new ProductResponse();

        response.setId(savedProduct.getId());
        response.setName(savedProduct.getName());
        response.setCategory(savedProduct.getCategory());
        response.setDescription(savedProduct.getDescription());
        response.setPrice(savedProduct.getPrice());
        response.setImageUrl(savedProduct.getImageUrl());
        response.setStockQuantity(savedProduct.getStockQuantity());
        response.setActive(savedProduct.getActive());

        return response;
    }

    public ProductResponse updateProduct(Long id, ProductRequest productRequest) {

        ProductResponse response = productRepository.findById(id)
                .map(existingProduct -> {
                    updateProductFromRequest(existingProduct, productRequest);
                    Product savedProduct = productRepository.save(existingProduct);
                    return mapToProductResponse(savedProduct);
                })
                .orElseThrow(() -> new com.app.ecom.exception.ResourceNotFoundException("Product not found: " + id));

        return response;
    }

    public Page<ProductResponse> getProducts(
            String search,
            String category,
            BigDecimal minPrice,
            BigDecimal maxPrice,
            Pageable pageable
    ) {
        // Price validations
        if (minPrice != null && minPrice.compareTo(BigDecimal.ZERO) < 0) {
            throw new BadRequestException("minPrice cannot be negative");
        }
        if (maxPrice != null && maxPrice.compareTo(BigDecimal.ZERO) < 0) {
            throw new BadRequestException("maxPrice cannot be negative");
        }
        if (minPrice != null && maxPrice != null && minPrice.compareTo(maxPrice) > 0) {
            throw new BadRequestException("minPrice cannot be greater than maxPrice");
        }

        // Sort field whitelist validation
        if (pageable.getSort().isSorted()) {
            for (Sort.Order order : pageable.getSort()) {
                if (!ALLOWED_SORT_FIELDS.contains(order.getProperty())) {
                    throw new BadRequestException("Invalid sort field: '" + order.getProperty() + "'. Allowed sort fields are: " + ALLOWED_SORT_FIELDS);
                }
            }
        }

        Specification<Product> spec = ProductSpecification.filterProducts(search, category, minPrice, maxPrice);
        return productRepository.findAll(spec, pageable).map(this::mapToProductResponse);
    }

    public Page<ProductResponse> getAllProducts(Pageable pageable) {
        return getProducts(null, null, null, null, pageable);
    }

    public List<String> getActiveCategories() {
        return productRepository.findDistinctActiveCategories();
    }

    public ProductResponse getProductById(Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new com.app.ecom.exception.ResourceNotFoundException("Product not found: " + id));
        if (!Boolean.TRUE.equals(product.getActive())) {
            throw new com.app.ecom.exception.ResourceNotFoundException("Product not found: " + id);
        }
        return mapToProductResponse(product);
    }

    public boolean deleteProduct(Long id) {
        return productRepository.findById(id)
                .map(product->{
                    product.setActive(false);
                    productRepository.save(product);
                    return true;
                }).orElse(false);
    }

    public List<ProductResponse> searchProducts(String keyword) {
        return productRepository.searchProducts(keyword).stream()
                .map((this::mapToProductResponse))
                .collect(Collectors.toList());

    }
}