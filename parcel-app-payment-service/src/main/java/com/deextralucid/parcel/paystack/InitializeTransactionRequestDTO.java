package com.deextralucid.parcel.paystack;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class InitializeTransactionRequestDTO {
    private String amount;
    private String email;
    private String reference;
    private String callback_url;
    private Integer invoice_limit;
    private Enums.Channels[] channels;
    private String subaccount;
    private Integer transaction_charge;

    private Enums.PaystackBearer paystackBearer = Enums.PaystackBearer.ACCOUNT;
}
