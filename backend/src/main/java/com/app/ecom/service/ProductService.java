package com.app.ecom.service;

import com.app.ecom.dto.ProductRequest;
import com.app.ecom.dto.ProductResponse;
import com.app.ecom.model.Product;
import com.app.ecom.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProductService {

    private final ProductRepository productRepository;

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

    public org.springframework.data.domain.Page<ProductResponse> getAllProducts(org.springframework.data.domain.Pageable pageable) {
        return productRepository.findByActiveTrue(pageable)
                .map(this::mapToProductResponse);
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