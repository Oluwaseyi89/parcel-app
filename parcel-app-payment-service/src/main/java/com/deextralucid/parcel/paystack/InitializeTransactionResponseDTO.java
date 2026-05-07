package com.deextralucid.parcel.paystack;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class InitializeTransactionResponseDTO {
    private Boolean status;
    private String message;
    private Data data;
}
