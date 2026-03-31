package com.deextralucid.parcel.paystack.orderpaymentcrud;

import com.deextralucid.parcel.paystack.ordersandpayments.OrderItem;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface OrderItemRepo extends JpaRepository<OrderItem, Long> {
    List<OrderItem> findByOrderId(Long order_id);

    List<OrderItem> findByProductId(Long product_id);
}
