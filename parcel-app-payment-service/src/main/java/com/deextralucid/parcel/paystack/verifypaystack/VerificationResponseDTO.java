package com.deextralucid.parcel.paystack.verifypaystack;

import java.io.Serializable;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.stereotype.Component;

@Component
@Getter
@Setter
@NoArgsConstructor
public class VerificationResponseDTO implements Serializable {

    private Boolean status;
    private String message;
    private VerificationData data;
}
