package com.app.ecom.controller;

import com.app.ecom.model.Product;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class ProductController {
    @PostMapping
    public ResponseEntity<ProductResponse>createProduct(@RequestBody ProductRequest){
        return new ResponseEntity<ProductResponse>(productService.createProduct(ProductRequest))
    }
}
