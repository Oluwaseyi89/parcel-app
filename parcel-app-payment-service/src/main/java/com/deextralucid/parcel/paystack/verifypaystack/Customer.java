package com.deextralucid.parcel.paystack.verifypaystack;

public class Customer {
    private String id;
    private String first_name;
    private String last_name;
    private String email;
    private String customer_code;
    private String phone;
    private String metadata;
    private String risk_action;

    public Customer () {}

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getFirst_name() {
        return first_name;
    }

    public void setFirst_name(String first_name) {
        this.first_name = first_name;
    }

    public String getLast_name() {
        return last_name;
    }

    public void setLast_name(String last_name) {
        this.last_name = last_name;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getCustomer_code() {
        return customer_code;
    }

    public void setCustomer_code(String customer_code) {
        this.customer_code = customer_code;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getMetadata() {
        return metadata;
    }

    public void setMetadata(String metadata) {
        this.metadata = metadata;
    }

    public String getRisk_action() {
        return risk_action;
    }

    public void setRisk_action(String risk_action) {
        this.risk_action = risk_action;
    }  

    

}
