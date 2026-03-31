package com.deextralucid.parcel.parcelcrud;

import com.deextralucid.parcel.parcelmodel.UserPayment;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Component;

@Component
public interface ParcelCrud extends JpaRepository<UserPayment, Integer>{
    UserPayment findByEmail(String email);    
}
