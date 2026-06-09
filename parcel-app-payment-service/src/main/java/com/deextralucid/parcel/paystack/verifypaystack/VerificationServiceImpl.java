package com.deextralucid.parcel.paystack.verifypaystack;

import java.util.Collections;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.reactive.function.client.WebClient;

@Service
public class VerificationServiceImpl implements VerificationService {

    private final WebClient webClient;

    @Value("${paystack.secret.key}")
    private String paystackSecretKey;

    @Value("${paystack.api.base.url}")
    private String paystackApiBaseUrl;

    public VerificationServiceImpl(WebClient.Builder webClientBuilder) {
        this.webClient = webClientBuilder.build();
    }

    @Override
    public String getPayment() {
        String url = paystackApiBaseUrl + "/transaction/verify";
        return this.webClient.get()
                .uri(url)
                .retrieve()
                .bodyToMono(String.class)
                .block();
    }

    @Override
    public VerificationResponseDTO getPaymentStatus(@PathVariable("paymentRef") String paymentRef) {
        String url = paystackApiBaseUrl + "/transaction/verify/" + paymentRef;
        return this.webClient.get()
                .uri(url)
                .retrieve()
                .bodyToMono(VerificationResponseDTO.class)
                .block();
    }

    @Override
    public VerificationResponseDTO getPaymentWithResponseHandling(@PathVariable("paymentRef") String paymentRef) {
        String url = "https://api.paystack.co/transaction/verify/" + paymentRef;
        ResponseEntity<VerificationResponseDTO> response = this.webClient.get()
                .uri(url)
                .retrieve()
                .toEntity(VerificationResponseDTO.class)
                .block();
        if (response == null) {
            return null;
        }
        if (response.getStatusCode() == HttpStatus.OK) {
            return response.getBody();
        } else {
            return null;
        }
    }

    @Override
    public VerificationResponseDTO getPaymentWithCustomHeaders(@PathVariable("paymentRef") String paymentRef) {
        String url = "https://api.paystack.co/transaction/verify/" + paymentRef;
        ResponseEntity<VerificationResponseDTO> response = this.webClient.get()
                .uri(url)
                .headers(headers -> {
                    headers.setAccept(Collections.singletonList(MediaType.APPLICATION_JSON));
                    headers.set("Authorization", "Bearer " + paystackSecretKey);
                })
                .retrieve()
                .toEntity(VerificationResponseDTO.class)
                .block();

        if (response == null) {
            return null;
        }

        if (response.getStatusCode() == HttpStatus.OK) {
            return response.getBody();
        } else {
            return null;
        }

    }
}
