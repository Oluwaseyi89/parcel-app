package com.deextralucid.parcel.paystack.orderpaymentcrud;

import com.deextralucid.parcel.paystack.ordersandpayments.Order;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Component;

@Component
public interface OrderRepo extends JpaRepository<Order, Long> {
    // Use JpaRepository#findById which returns Optional<Order>
}
