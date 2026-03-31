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
@Table(name = "parcel_product_product")
public class Product {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "vendor_name")
    private String vendorName;
    
    @Column(name = "vendor_phone")
    private String vendorPhone;
    
    @Column(name = "vendor_email")
    private String vendorEmail;
    
    @Column(name = "vend_photo")
    private String vendPhoto;
    
    @Column(name = "prod_cat")
    private String prodCat;
    
    @Column(name = "prod_name", nullable = false)
    private String prodName;
    
    @Column(name = "prod_model")
    private String prodModel;
    
    @Column(name = "prod_photo")
    private String prodPhoto;
    
    @Column(name = "prod_price")
    private String prodPrice;
    
    @Column(name = "prod_qty")
    private Integer prodQty;
    
    @Column(name = "prod_disc")
    private String prodDisc;
    
    @Column(name = "prod_desc")
    private String prodDesc;
    
    @Column(name = "img_base")
    private String imgBase;
    
    @Column(name = "appr_officer")
    private String apprOfficer;
    
    @Column(name = "appr_date")
    private String apprDate;
    
    @Column(name = "created_at", columnDefinition = "TIMESTAMP DEFAULT CURRENT_TIMESTAMP")
    @Temporal(TemporalType.TIMESTAMP)
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at", columnDefinition = "TIMESTAMP DEFAULT CURRENT_TIMESTAMP")
    @Temporal(TemporalType.TIMESTAMP)
    private LocalDateTime updatedAt;

    public Product() {
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getVendor_name() {
        return vendorName;
    }

    public void setVendor_name(String vendorName) {
        this.vendorName = vendorName;
    }

    public String getVendor_phone() {
        return vendorPhone;
    }

    public void setVendor_phone(String vendorPhone) {
        this.vendorPhone = vendorPhone;
    }

    public String getVendor_email() {
        return vendorEmail;
    }

    public void setVendor_email(String vendorEmail) {
        this.vendorEmail = vendorEmail;
    }

    public String getVend_photo() {
        return vendPhoto;
    }

    public void setVend_photo(String vendPhoto) {
        this.vendPhoto = vendPhoto;
    }

    public String getProd_cat() {
        return prodCat;
    }

    public void setProd_cat(String prodCat) {
        this.prodCat = prodCat;
    }

    public String getProd_name() {
        return prodName;
    }

    public void setProd_name(String prodName) {
        this.prodName = prodName;
    }

    public String getProd_model() {
        return prodModel;
    }

    public void setProd_model(String prodModel) {
        this.prodModel = prodModel;
    }

    public String getProd_photo() {
        return prodPhoto;
    }

    public void setProd_photo(String prodPhoto) {
        this.prodPhoto = prodPhoto;
    }

    public String getProd_price() {
        return prodPrice;
    }

    public void setProd_price(String prodPrice) {
        this.prodPrice = prodPrice;
    }

    public Integer getProd_qty() {
        return prodQty;
    }

    public void setProd_qty(Integer prodQty) {
        this.prodQty = prodQty;
    }

    public String getProd_disc() {
        return prodDisc;
    }

    public void setProd_disc(String prodDisc) {
        this.prodDisc = prodDisc;
    }

    public String getProd_desc() {
        return prodDesc;
    }

    public void setProd_desc(String prodDesc) {
        this.prodDesc = prodDesc;
    }

    public String getImg_base() {
        return imgBase;
    }

    public void setImg_base(String imgBase) {
        this.imgBase = imgBase;
    }

    public String getAppr_officer() {
        return apprOfficer;
    }

    public void setAppr_officer(String apprOfficer) {
        this.apprOfficer = apprOfficer;
    }

    public String getAppr_date() {
        return apprDate;
    }

    public void setAppr_date(String apprDate) {
        this.apprDate = apprDate;
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
