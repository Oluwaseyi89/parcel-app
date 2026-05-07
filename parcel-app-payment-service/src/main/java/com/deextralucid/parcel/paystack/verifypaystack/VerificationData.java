package com.deextralucid.parcel.paystack.verifypaystack;

import com.fasterxml.jackson.annotation.JsonAnyGetter;
import com.fasterxml.jackson.annotation.JsonAnySetter;
import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.LinkedHashMap;
import java.util.Map;

@Getter
@Setter
@NoArgsConstructor
public class VerificationData {
    private Integer id;
    private String status;
    private String reference;
    private String gateway_response;
    @Getter(AccessLevel.NONE)
    @JsonIgnore
    private final Map<String, Object> additionalFields = new LinkedHashMap<>();

    @JsonAnySetter
    public void captureAdditionalField(String name, Object value) {
        additionalFields.put(name, value);
    }

    @JsonAnyGetter
    public Map<String, Object> getAdditionalFields() {
        return additionalFields;
    }
}
