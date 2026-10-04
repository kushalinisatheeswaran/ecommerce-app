package com.app.ecom;

import com.app.ecom.dto.OrderItemDTO;
import com.app.ecom.model.CartItem;
import com.app.ecom.model.OrderItem;
import com.app.ecom.model.Product;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.assertEquals;

class MoneySemanticsTest {

    @Test
    void unitPriceTwenty_QuantityThree_LineTotalIsSixty() {
        BigDecimal unitPrice = new BigDecimal("20.00");
        int quantity = 3;
        BigDecimal expectedLineTotal = new BigDecimal("60.00");

        BigDecimal calculatedLineTotal = unitPrice.multiply(BigDecimal.valueOf(quantity));

        assertEquals(expectedLineTotal, calculatedLineTotal);
    }

    @Test
    void orderItemDTO_LineTotalMatchesUnitPriceTimesQuantity() {
        BigDecimal unitPrice = new BigDecimal("20.00");
        int quantity = 3;
        BigDecimal lineTotal = unitPrice.multiply(BigDecimal.valueOf(quantity));

        OrderItemDTO dto = OrderItemDTO.builder()
                .id(1L)
                .productId(100L)
                .quantity(quantity)
                .unitPrice(unitPrice)
                .lineTotal(lineTotal)
                .build();

        assertEquals(new BigDecimal("20.00"), dto.getUnitPrice());
        assertEquals(new BigDecimal("60.00"), dto.getLineTotal());
        assertEquals(new BigDecimal("60.00"), dto.getSubTotal());
    }
}
