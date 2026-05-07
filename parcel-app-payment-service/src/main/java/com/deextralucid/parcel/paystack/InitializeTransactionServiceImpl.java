package com.deextralucid.parcel.paystack;

import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.client.RestTemplate;

@Service
public class InitializeTransactionServiceImpl implements InitializeTransactionService {
    RestTemplate restTemplate = new RestTemplate();

    @Value("${paystack.secret.key}")
    private String paystackSecretKey;

    @Override
    public InitializeTransactionResponseDTO initializeTransaction(
            InitializeTransactionRequestDTO initializeTransactionRequestDTO) {
        String url = "https://api.paystack.co/transaction/initialize";
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("Authorization", "Bearer " + paystackSecretKey);

        HttpEntity <InitializeTransactionRequestDTO> entity = new HttpEntity<InitializeTransactionRequestDTO>(initializeTransactionRequestDTO, headers);
        ResponseEntity <InitializeTransactionResponseDTO> response = restTemplate.postForEntity(url, entity, InitializeTransactionResponseDTO.class);
        return response.getBody();
    }
}
