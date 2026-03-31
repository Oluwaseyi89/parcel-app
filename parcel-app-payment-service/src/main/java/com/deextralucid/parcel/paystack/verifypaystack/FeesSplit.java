package com.deextralucid.parcel.paystack.verifypaystack;

public class FeesSplit {
    private Integer paystack;
    private Integer integration;
    private Integer subaccount;
    private Params params;
    
    public FeesSplit () {}

    public Integer getPaystack() {
        return paystack;
    }

    public void setPaystack(Integer paystack) {
        this.paystack = paystack;
    }

    public Integer getIntegration() {
        return integration;
    }

    public void setIntegration(Integer integration) {
        this.integration = integration;
    }

    public Integer getSubaccount() {
        return subaccount;
    }

    public void setSubaccount(Integer subaccount) {
        this.subaccount = subaccount;
    }

    public Params getParams() {
        return params;
    }

    public void setParams(Params params) {
        this.params = params;
    }

    

}
