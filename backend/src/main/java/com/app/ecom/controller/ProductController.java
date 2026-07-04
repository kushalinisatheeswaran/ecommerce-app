package com.app.ecom.controller;

import com.app.ecom.dto.ProductRequest;
import com.app.ecom.dto.ProductResponse;
import com.app.ecom.service.ProductService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/products")
public class ProductController {

    private final ProductService productService;

    @PostMapping
    public ResponseEntity<ProductResponse> createProduct(
            @RequestBody @Valid ProductRequest productRequest) {

        ProductResponse response = productService.createProduct(productRequest);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }
    @GetMapping
    public ResponseEntity<org.springframework.data.domain.Page<ProductResponse>> getProduct(
            org.springframework.data.domain.Pageable pageable) {
      return ResponseEntity.ok(productService.getAllProducts(pageable));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ProductResponse> updateProduct(
            @PathVariable Long id,
            @RequestBody @Valid ProductRequest productRequest) {

        ProductResponse response = productService.updateProduct(id, productRequest);
        return ResponseEntity.ok(response);
    }
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteProduct(
            @PathVariable Long id) {
         boolean deleted= productService.deleteProduct(id);
        return deleted ? ResponseEntity.noContent().build() :ResponseEntity.notFound().build();
    }
    @GetMapping("/search")
    public ResponseEntity<List<ProductResponse>>searchProduct(@RequestParam String keyword) {
        return ResponseEntity.ok(productService.searchProducts(keyword));
    }
}