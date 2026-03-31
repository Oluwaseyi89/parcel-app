package com.deextralucid.parcel.paystack.verifypaystack;

public class Params {
    private String bearer;
    private String transaction_charge;
    private String percentage_charge;

    public Params () {}

    public String getBearer() {
        return bearer;
    }

    public void setBearer(String bearer) {
        this.bearer = bearer;
    }

    public String getTransaction_charge() {
        return transaction_charge;
    }

    public void setTransaction_charge(String transaction_charge) {
        this.transaction_charge = transaction_charge;
    }

    public String getPercentage_charge() {
        return percentage_charge;
    }

    public void setPercentage_charge(String percentage_charge) {
        this.percentage_charge = percentage_charge;
    }

    

}
