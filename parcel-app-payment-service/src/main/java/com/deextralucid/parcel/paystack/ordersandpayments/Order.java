package com.deextralucid.parcel.paystack.ordersandpayments;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Temporal;
import jakarta.persistence.TemporalType;

import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@Entity
@Component
@Table(name = "parcel_order_orderdetail")
public class Order {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "customer_id")
    private String customerId;
    
    @Column(name = "customer_name")
    private String customerName;
    
    @Column(name = "total_items")
    private Integer totalItems;
    
    @Column(name = "total_price")
    private Integer totalPrice;
    
    @Column(name = "shipping_method")
    private String shippingMethod;
    
    @Column(name = "shipping_fee")
    private String shippingFee;
    
    @Column(name = "zip_code")
    private String zipCode;
    
    @Column(name = "payment_id")
    private String paymentId;
    
    @Column(name = "is_customer")
    private Boolean isCustomer;
    
    @Column(name = "is_completed")
    private Boolean isCompleted;
    
    @Column(name = "created_at", columnDefinition = "TIMESTAMP DEFAULT CURRENT_TIMESTAMP")
    @Temporal(TemporalType.TIMESTAMP)
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at", columnDefinition = "TIMESTAMP DEFAULT CURRENT_TIMESTAMP")
    @Temporal(TemporalType.TIMESTAMP)
    private LocalDateTime updatedAt;

    public Order() {}

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getCustomer_id() {
        return customerId;
    }

    public void setCustomer_id(String customerId) {
        this.customerId = customerId;
    }

    public String getCustomer_name() {
        return customerName;
    }

    public void setCustomer_name(String customerName) {
        this.customerName = customerName;
    }

    public Integer getTotal_items() {
        return totalItems;
    }

    public void setTotal_items(Integer totalItems) {
        this.totalItems = totalItems;
    }

    public Integer getTotal_price() {
        return totalPrice;
    }

    public void setTotal_price(Integer totalPrice) {
        this.totalPrice = totalPrice;
    }

    public String getShipping_method() {
        return shippingMethod;
    }

    public void setShipping_method(String shippingMethod) {
        this.shippingMethod = shippingMethod;
    }

    public String getShipping_fee() {
        return shippingFee;
    }

    public void setShipping_fee(String shippingFee) {
        this.shippingFee = shippingFee;
    }

    public String getZip_code() {
        return zipCode;
    }

    public void setZip_code(String zipCode) {
        this.zipCode = zipCode;
    }

    public String getPayment_id() {
        return paymentId;
    }

    public void setPayment_id(String paymentId) {
        this.paymentId = paymentId;
    }

    public Boolean getIs_customer() {
        return isCustomer;
    }

    public void setIs_customer(Boolean isCustomer) {
        this.isCustomer = isCustomer;
    }

    public Boolean getIs_completed() {
        return isCompleted;
    }

    public void setIs_completed(Boolean isCompleted) {
        this.isCompleted = isCompleted;
    }

    public LocalDateTime getCreated_at() {
        return createdAt;
    }

    public void setCreated_at(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdated_at() {
        return updatedAt;
    }

    public void setUpdated_at(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }    
}
