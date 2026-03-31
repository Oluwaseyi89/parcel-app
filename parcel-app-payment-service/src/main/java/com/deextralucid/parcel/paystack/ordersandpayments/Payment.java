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
@Table(name = "parcel_order_paymentdetail")
public class Payment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "order_id")
    private Long orderId;
    
    @Column(name = "customer_id")
    private String customerId;
    
    @Column(name = "customer_name")
    private String customerName;
    
    @Column(name = "is_customer")
    private Boolean isCustomer;
    
    private Integer amount;
    
    @Column(name = "shipping_fee")
    private Integer shippingFee;
    
    @Column(name = "grand_total_amount")
    private Integer grandTotalAmount;
    
    private String provider;
    
    @Column(name = "payment_type")
    private String paymentType;
    
    private String status;
    
    @Column(unique = true)
    private String reference;
    
    @Column(name = "created_at", columnDefinition = "TIMESTAMP DEFAULT CURRENT_TIMESTAMP")
    @Temporal(TemporalType.TIMESTAMP)
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at", columnDefinition = "TIMESTAMP DEFAULT CURRENT_TIMESTAMP")
    @Temporal(TemporalType.TIMESTAMP)
    private LocalDateTime updatedAt;

    public Payment() {}

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

    public Boolean getIs_customer() {
        return isCustomer;
    }

    public void setIs_customer(Boolean isCustomer) {
        this.isCustomer = isCustomer;
    }

    public Integer getAmount() {
        return amount;
    }

    public void setAmount(Integer amount) {
        this.amount = amount;
    }

    public Integer getShipping_fee() {
        return shippingFee;
    }

    public void setShipping_fee(Integer shippingFee) {
        this.shippingFee = shippingFee;
    }

    public Integer getGrand_total_amount() {
        return grandTotalAmount;
    }

    public void setGrand_total_amount(Integer grandTotalAmount) {
        this.grandTotalAmount = grandTotalAmount;
    }

    public String getProvider() {
        return provider;
    }

    public void setProvider(String provider) {
        this.provider = provider;
    }

    public String getPayment_type() {
        return paymentType;
    }

    public void setPayment_type(String paymentType) {
        this.paymentType = paymentType;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getReference() {
        return reference;
    }

    public void setReference(String reference) {
        this.reference = reference;
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
