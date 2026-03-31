package com.deextralucid.parcel.paystack.verifypaystack;

import java.util.Collections;

import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.client.RestTemplate;

@Service
public class VerificationServiceImpl implements VerificationService {

    private final RestTemplate restTemplate;

    public VerificationServiceImpl(RestTemplateBuilder restTemplateBuilder) {
        this.restTemplate = restTemplateBuilder.build();
    }

    @Override
    public String getPayment() {
        String url = "https://api.paystack.co/transaction/verify";
        return this.restTemplate.getForObject(url, String.class);
    }

    @Override
    public VerificationResponseDTO getPaymentStatus(@PathVariable("paymentRef") String paymentRef) {
        String url = "https://api.paystack.co/transaction/verify/" + paymentRef;
        return this.restTemplate.getForObject(url, VerificationResponseDTO.class, paymentRef);
    }

    @Override
    public VerificationResponseDTO getPaymentWithResponseHandling(@PathVariable("paymentRef") String paymentRef) {
        String url = "https://api.paystack.co/transaction/verify/" + paymentRef;
        ResponseEntity<VerificationResponseDTO> response = this.restTemplate.getForEntity(url,
                VerificationResponseDTO.class, paymentRef);
        if (response.getStatusCode() == HttpStatus.OK) {
            return response.getBody();
        } else {
            return null;
        }
    }

    @Override
    public VerificationResponseDTO getPaymentWithCustomHeaders(@PathVariable("paymentRef") String paymentRef) {
        String url = "https://api.paystack.co/transaction/verify/" + paymentRef;
        String key = "sk_test_a07a45baef63500fbf6ab432fffee907e2300e98";
        HttpHeaders headers = new HttpHeaders();
        headers.setAccept(Collections.singletonList(MediaType.APPLICATION_JSON));
        headers.set("Authorization", "Bearer " + key);
        HttpEntity<VerificationResponseDTO> request = new HttpEntity<VerificationResponseDTO>(headers);

        ResponseEntity<VerificationResponseDTO> response = this.restTemplate.exchange(url, HttpMethod.GET, request,
                VerificationResponseDTO.class, paymentRef);

        if (response.getStatusCode() == HttpStatus.OK) {
            return response.getBody();
        } else {
            return null;
        }

    }
}
