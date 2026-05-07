package com.deextralucid.parcel.paystack.verifypaystack;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class Params {
    private String bearer;
    private String transaction_charge;
    private String percentage_charge;
}
