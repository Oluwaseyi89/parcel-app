package com.deextralucid.parcel.paystack;

import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

@Service
public class InitializeTransactionServiceImpl implements InitializeTransactionService {
    RestTemplate restTemplate = new RestTemplate();

    @Override
    public InitializeTransactionResponseDTO initializeTransaction(
            InitializeTransactionRequestDTO initializeTransactionRequestDTO) {
        String url = "https://api.paystack.co/transaction/initialize";
        HttpHeaders headers = new HttpHeaders();
        String key = "sk_test_a07a45baef63500fbf6ab432fffee907e2300e98";
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("Authorization", "Bearer " + key);

        HttpEntity <InitializeTransactionRequestDTO> entity = new HttpEntity<InitializeTransactionRequestDTO>(initializeTransactionRequestDTO, headers);
        ResponseEntity <InitializeTransactionResponseDTO> response = restTemplate.postForEntity(url, entity, InitializeTransactionResponseDTO.class);
        return response.getBody();
    }
}
