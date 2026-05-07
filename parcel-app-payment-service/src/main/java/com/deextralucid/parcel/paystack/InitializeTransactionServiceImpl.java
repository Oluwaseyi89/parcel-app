package com.deextralucid.parcel.paystack;

import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.reactive.function.client.WebClient;

@Service
public class InitializeTransactionServiceImpl implements InitializeTransactionService {
    private final WebClient webClient;

    public InitializeTransactionServiceImpl(WebClient.Builder webClientBuilder) {
        this.webClient = webClientBuilder.build();
    }

    @Value("${paystack.secret.key}")
    private String paystackSecretKey;

    @Override
    public InitializeTransactionResponseDTO initializeTransaction(
            InitializeTransactionRequestDTO initializeTransactionRequestDTO) {
        String url = "https://api.paystack.co/transaction/initialize";
        return webClient.post()
                .uri(url)
                .contentType(MediaType.APPLICATION_JSON)
                .headers(headers -> headers.set("Authorization", "Bearer " + paystackSecretKey))
                .bodyValue(initializeTransactionRequestDTO)
                .retrieve()
                .bodyToMono(InitializeTransactionResponseDTO.class)
                .block();
    }
}
