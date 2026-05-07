package com.deextralucid.parcel.paystack;

import com.deextralucid.parcel.paystack.verifypaystack.VerificationData;
import com.deextralucid.parcel.paystack.verifypaystack.VerificationResponseDTO;
import com.deextralucid.parcel.paystack.verifypaystack.VerificationService;
import com.fasterxml.jackson.databind.ObjectMapper;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@RestController
@CrossOrigin(origins = "http://localhost:3000")
@RequestMapping("/v1")
public class InitializeTransactionController {

    private static final Logger logger = LoggerFactory.getLogger(InitializeTransactionController.class);

    private final WebClient webClient;

    public InitializeTransactionController(WebClient.Builder webClientBuilder) {
        this.webClient = webClientBuilder.build();
    }

    @Autowired
    private InitializeTransactionService initializeTransactionService;

    @Autowired
    private VerificationService verificationService;

    @Autowired
    private ObjectMapper objectMapper;

    @Value("${parcelapp.service.base-url:http://localhost:8000}")
    private String parcelAppServiceBaseUrl;

    @Value("${parcelapp.service.payment-sync-token:}")
    private String paymentSyncToken;

    @Value("${parcelapp.service.payment-sync-path:/order/payments/internal/sync}")
    private String paymentSyncPath;

    @RequestMapping(path = "/initializetransaction", method = RequestMethod.POST)
    public InitializeTransactionResponseDTO initializeTransaction(
            @RequestBody InitializeTransactionRequestDTO initializeTransactionRequestDTO) {
        InitializeTransactionResponseDTO initializeTransaction = initializeTransactionService
                .initializeTransaction(initializeTransactionRequestDTO);
        return initializeTransaction;
    }

    @RequestMapping(path = "/verifypayment/{paymentRef}", method = RequestMethod.GET)
    public boolean verifyMyPayment(@PathVariable("paymentRef") String paymentRef) {
        VerificationResponseDTO myResponse = verificationService.getPaymentWithCustomHeaders(paymentRef);
        if (myResponse == null || myResponse.getData() == null) {
            logger.warn("Paystack verification response is empty for reference {}", paymentRef);
            return false;
        }

        VerificationData verificationData = myResponse.getData();
        String providerStatus = verificationData.getStatus() == null ? "" : verificationData.getStatus().toLowerCase();
        String canonicalStatus = mapProviderStatus(providerStatus);

        boolean syncOk = syncPaymentStatusWithParcelService(paymentRef, canonicalStatus, verificationData, myResponse);
        if (!syncOk) {
            return false;
        }

        return "completed".equals(canonicalStatus);
    }

    @RequestMapping(path = "/verifypaydetail/{paymentRef}", method = RequestMethod.GET)
    public VerificationResponseDTO verifyMyPaymentWithDetail(@PathVariable("paymentRef") String paymentRef) {
        VerificationResponseDTO myResponse = verificationService.getPaymentWithCustomHeaders(paymentRef);

        return myResponse;
    }

    private String mapProviderStatus(String providerStatus) {
        if ("success".equals(providerStatus)) {
            return "completed";
        }
        if ("pending".equals(providerStatus) || "ongoing".equals(providerStatus)) {
            return "processing";
        }
        if ("reversed".equals(providerStatus) || "refunded".equals(providerStatus)) {
            return "refunded";
        }
        return "failed";
    }

    private boolean syncPaymentStatusWithParcelService(
            String paymentRef,
            String canonicalStatus,
            VerificationData verificationData,
            VerificationResponseDTO verificationResponse) {
        if (paymentSyncToken == null || paymentSyncToken.isBlank()) {
            logger.error("Missing parcel-app-service sync token (parcelapp.service.payment-sync-token)");
            return false;
        }

        String baseUrl = parcelAppServiceBaseUrl.endsWith("/")
                ? parcelAppServiceBaseUrl.substring(0, parcelAppServiceBaseUrl.length() - 1)
                : parcelAppServiceBaseUrl;
        String syncPath = paymentSyncPath.startsWith("/") ? paymentSyncPath : "/" + paymentSyncPath;
        String url = baseUrl + syncPath + "/" + paymentRef + "/";

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("status", canonicalStatus);
        body.put("event_id", buildEventId(paymentRef, verificationData));

        String transactionId = verificationData.getId() == null ? "" : String.valueOf(verificationData.getId());
        body.put("transaction_id", transactionId);

        String failureReason = "";
        if ("failed".equals(canonicalStatus)) {
            failureReason = verificationData.getGateway_response() == null
                    ? "Paystack verification returned non-success status"
                    : verificationData.getGateway_response();
        }
        body.put("failure_reason", failureReason);
        body.put("provider_response", objectMapper.convertValue(verificationResponse, Map.class));

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("X-Internal-Service-Token", paymentSyncToken);

        try {
            ResponseEntity<Void> response = webClient.post()
                    .uri(url)
                    .headers(httpHeaders -> httpHeaders.addAll(headers))
                    .bodyValue(body)
                    .retrieve()
                    .toBodilessEntity()
                    .block();

            if (response == null || !response.getStatusCode().is2xxSuccessful()) {
                String status = response == null ? "no-response" : response.getStatusCode().toString();
                logger.error("Parcel payment sync failed for ref {} with status {}", paymentRef, status);
                return false;
            }

            logger.info("Parcel payment sync succeeded for ref {} with canonical status {}", paymentRef, canonicalStatus);
            return true;
        } catch (Exception ex) {
            logger.error("Parcel payment sync call failed for ref {}", paymentRef, ex);
            return false;
        }
    }

    private String buildEventId(String paymentRef, VerificationData verificationData) {
        if (verificationData.getId() != null) {
            return "paystack-txn-" + verificationData.getId();
        }
        return "paystack-ref-" + paymentRef + "-" + UUID.randomUUID();
    }

}
