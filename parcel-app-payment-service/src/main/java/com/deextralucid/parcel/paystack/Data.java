package com.deextralucid.parcel.paystack;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.stereotype.Component;


@Component
@Getter
@Setter
@NoArgsConstructor
public class Data {
    private String reference;
    private String authorization_url;
    private String access_code;
}
