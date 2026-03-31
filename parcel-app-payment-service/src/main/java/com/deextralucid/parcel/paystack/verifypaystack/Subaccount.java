package com.deextralucid.parcel.paystack.verifypaystack;

public class Subaccount {

    private String id;
    private String subaccount_code;
    private String business_name;
    private String description;
    private String primary_contact_name;
    private String primary_contact_email;
    private String primary_contact_phone;
    private String metadata;
    private Integer percentage_charge;
    private String settlement_bank;
    private String account_number;

    public Subaccount () {}

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getSubaccount_code() {
        return subaccount_code;
    }

    public void setSubaccount_code(String subaccount_code) {
        this.subaccount_code = subaccount_code;
    }

    public String getBusiness_name() {
        return business_name;
    }

    public void setBusiness_name(String business_name) {
        this.business_name = business_name;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getPrimary_contact_name() {
        return primary_contact_name;
    }

    public void setPrimary_contact_name(String primary_contact_name) {
        this.primary_contact_name = primary_contact_name;
    }

    public String getPrimary_contact_email() {
        return primary_contact_email;
    }

    public void setPrimary_contact_email(String primary_contact_email) {
        this.primary_contact_email = primary_contact_email;
    }

    public String getPrimary_contact_phone() {
        return primary_contact_phone;
    }

    public void setPrimary_contact_phone(String primary_contact_phone) {
        this.primary_contact_phone = primary_contact_phone;
    }

    public String getMetadata() {
        return metadata;
    }

    public void setMetadata(String metadata) {
        this.metadata = metadata;
    }

    public Integer getPercentage_charge() {
        return percentage_charge;
    }

    public void setPercentage_charge(Integer percentage_charge) {
        this.percentage_charge = percentage_charge;
    }

    public String getSettlement_bank() {
        return settlement_bank;
    }

    public void setSettlement_bank(String settlement_bank) {
        this.settlement_bank = settlement_bank;
    }

    public String getAccount_number() {
        return account_number;
    }

    public void setAccount_number(String account_number) {
        this.account_number = account_number;
    }

}
