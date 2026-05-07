package com.deextralucid.parcel.paystack.verifypaystack;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class FeesSplit {
    private Integer paystack;
    private Integer integration;
    private Integer subaccount;
    private Params params;
}
