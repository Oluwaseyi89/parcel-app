package com.deextralucid.parcel.paystack.verifypaystack;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class Subaccount {

    private String id;
    private String subaccount_code;
    private String business_name;
    private String description;
    private String primary_contact_name;
    private String primary_contact_email;
    private String primary_contact_phone;
    private String metadata;
    private Integer percentage_charge;
    private String settlement_bank;
    private String account_number;
}
