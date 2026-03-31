package com.deextralucid.parcel.paystack.verifypaystack;

import java.io.Serializable;

import org.springframework.stereotype.Component;

@Component
public class VerificationResponseDTO implements Serializable {

    private Boolean status;
    private String message;
    private VerificationData data;

    public VerificationResponseDTO () {}

    public Boolean getStatus() {
        return status;
    }

    public void setStatus(Boolean status) {
        this.status = status;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public VerificationData getData() {
        return data;
    }

    public void setData(VerificationData data) {
        this.data = data;
    }
}
