package com.deextralucid.parcel.paystack.verifypaystack;

public class Log {
    private Integer start_time;
    private Integer time_spent;
    private Integer attempts;
    private Integer errors;
    private Boolean success;
    private Boolean mobile;
    private String[] input;
    private History[] history;

    public Log () {}

    public Integer getStart_time() {
        return start_time;
    }

    public void setStart_time(Integer start_time) {
        this.start_time = start_time;
    }

    public Integer getTime_spent() {
        return time_spent;
    }

    public void setTime_spent(Integer time_spent) {
        this.time_spent = time_spent;
    }

    public Integer getAttempts() {
        return attempts;
    }

    public void setAttempts(Integer attempts) {
        this.attempts = attempts;
    }

    public Integer getErrors() {
        return errors;
    }

    public void setErrors(Integer errors) {
        this.errors = errors;
    }

    public Boolean getSuccess() {
        return success;
    }

    public void setSuccess(Boolean success) {
        this.success = success;
    }

    public Boolean getMobile() {
        return mobile;
    }

    public void setMobile(Boolean mobile) {
        this.mobile = mobile;
    }

    public String[] getInput() {
        return input;
    }

    public void setInput(String[] input) {
        this.input = input;
    }

    public History[] getHistory() {
        return history;
    }

    public void setHistory(History[] history) {
        this.history = history;
    }

    
}
