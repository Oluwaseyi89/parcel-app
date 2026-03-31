package com.deextralucid.parcel.paystack;

import org.springframework.stereotype.Component;


@Component
public  class Data {
     
    private String reference;  
    private String authorization_url;
    private String access_code;

    public Data() {
    }

   
    public String getAuthorization_url() {
                return authorization_url;
            }
        
    public void setAuthorizaton_url(String authorization_url) {
        this.authorization_url = authorization_url;
    }
        
    public String getAccess_code() {
        return access_code;
    }
        
    public void setAccess_code(String access_code) {
        this.access_code = access_code;
    }
  
    public String getReference() {
        return reference;
    }

    public void setReference(String reference) {
        this.reference = reference;
    }
}
