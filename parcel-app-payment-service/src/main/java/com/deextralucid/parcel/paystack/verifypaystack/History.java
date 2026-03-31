package com.deextralucid.parcel.paystack.verifypaystack;

public class History {
    private String type;
    private String message;
    private Integer time;

    public History () {}

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public Integer getTime() {
        return time;
    }

    public void setTime(Integer time) {
        this.time = time;
    }

    
}
