package com.deextralucid.parcel.parcelcrud;

import com.deextralucid.parcel.parcelmodel.PaymentDetail;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Component;

@Component
public interface PaymentCrud extends JpaRepository<PaymentDetail, Integer>{  
}
