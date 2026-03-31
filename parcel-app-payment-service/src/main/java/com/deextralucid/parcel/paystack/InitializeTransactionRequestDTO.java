package com.deextralucid.parcel.paystack;

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

    public String getAmount() {
        return amount;
    }

    public void setAmount(String amount) {
        this.amount = amount;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getReference() {
        return reference;
    }

    public void setReference(String reference) {
        this.reference = reference;
    }

    public String getCallback_url() {
        return callback_url;
    }

    public void setCallback_url(String callback_url) {
        this.callback_url = callback_url;
    }

    public Integer getInvoice_limit() {
        return invoice_limit;
    }

    public void setInvoice_limit(Integer invoice_limit) {
        this.invoice_limit = invoice_limit;
    }

    public Enums.Channels[] getChannels() {
        return channels;
    }

    public void setChannels(Enums.Channels[] channels) {
        this.channels = channels;
    }

    public String getSubaccount() {
        return subaccount;
    }

    public void setSubaccount(String subaccount) {
        this.subaccount = subaccount;
    }

    public Integer getTransaction_charge() {
        return transaction_charge;
    }

    public void setTransaction_charge(Integer transaction_charge) {
        this.transaction_charge = transaction_charge;
    }

    public Enums.PaystackBearer getPaystackBearer() {
        return paystackBearer;
    }

    public void setPaystackBearer(Enums.PaystackBearer paystackBearer) {
        this.paystackBearer = paystackBearer;
    }
}
