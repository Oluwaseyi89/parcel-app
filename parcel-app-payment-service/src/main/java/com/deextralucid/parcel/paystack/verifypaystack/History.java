package com.deextralucid.parcel.paystack.verifypaystack;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class History {
    private String type;
    private String message;
    private Integer time;
}
