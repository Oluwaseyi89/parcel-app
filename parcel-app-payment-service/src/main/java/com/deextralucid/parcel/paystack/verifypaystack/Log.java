package com.deextralucid.parcel.paystack.verifypaystack;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class Log {
    private Integer start_time;
    private Integer time_spent;
    private Integer attempts;
    private Integer errors;
    private Boolean success;
    private Boolean mobile;
    private String[] input;
    private History[] history;
}
