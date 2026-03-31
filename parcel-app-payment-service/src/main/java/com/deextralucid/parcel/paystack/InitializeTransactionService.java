package com.deextralucid.parcel.paystack;

public interface InitializeTransactionService {
    InitializeTransactionResponseDTO initializeTransaction(
        InitializeTransactionRequestDTO initializeTransactionRequestDTO
    );
}
