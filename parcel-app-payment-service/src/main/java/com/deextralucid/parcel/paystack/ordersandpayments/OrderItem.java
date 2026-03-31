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
@Table(name = "parcel_order_orderitem")
public class OrderItem {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "order_id", nullable = false)
    private Long orderId;
    
    @Column(name = "product_id", nullable = false)
    private Long productId;
    
    @Column(name = "product_name")
    private String productName;
    
    @Column(nullable = false)
    private Integer quantity;
    
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

    public OrderItem() {
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getOrder_id() {
        return orderId;
    }

    public void setOrder_id(Long orderId) {
        this.orderId = orderId;
    }

    public Long getProduct_id() {
        return productId;
    }

    public void setProduct_id(Long productId) {
        this.productId = productId;
    }

    public String getProduct_name() {
        return productName;
    }

    public void setProduct_name(String productName) {
        this.productName = productName;
    }

    public Integer getQuantity() {
        return quantity;
    }

    public void setQuantity(Integer quantity) {
        this.quantity = quantity;
    }

    public Boolean isIs_customer() {
        return isCustomer;
    }

    public void setIs_customer(Boolean isCustomer) {
        this.isCustomer = isCustomer;
    }

    public Boolean isIs_completed() {
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
