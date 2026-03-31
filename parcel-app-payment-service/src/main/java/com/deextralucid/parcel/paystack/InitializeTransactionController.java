package com.deextralucid.parcel.paystack;

import com.deextralucid.parcel.paystack.orderpaymentcrud.OrderItemRepo;
import com.deextralucid.parcel.paystack.orderpaymentcrud.OrderRepo;
import com.deextralucid.parcel.paystack.orderpaymentcrud.PaymentRepo;
import com.deextralucid.parcel.paystack.orderpaymentcrud.ProductRepo;
import com.deextralucid.parcel.paystack.ordersandpayments.Order;
import com.deextralucid.parcel.paystack.ordersandpayments.Payment;
import com.deextralucid.parcel.paystack.ordersandpayments.Product;
import java.util.Optional;
import java.util.List;
import com.deextralucid.parcel.paystack.ordersandpayments.OrderItem;
import com.deextralucid.parcel.paystack.verifypaystack.VerificationResponseDTO;
import com.deextralucid.parcel.paystack.verifypaystack.VerificationService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RestController;

@RestController
@CrossOrigin(origins = "http://localhost:3000")
@RequestMapping("/v1")
public class InitializeTransactionController {

    @Autowired
    private InitializeTransactionService initializeTransactionService;

    @Autowired
    private VerificationService verificationService;

    @Autowired
    private PaymentRepo paymentRepo;

    @Autowired
    private OrderRepo orderRepo;

    @Autowired
    private OrderItemRepo orderItemRepo;

    @Autowired
    private ProductRepo productRepo;

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
        System.out.println(myResponse.getMessage());
        String paymentStatus = myResponse.getData().getStatus();

        if (paymentStatus.equals("success")) {
            System.out.println(paymentStatus);
            Payment currPayment = paymentRepo.findByReference(paymentRef);
            currPayment.setStatus("Successful");
            paymentRepo.save(currPayment);

            Long currOrderId = currPayment.getOrder_id();

            java.util.Optional<Order> orderOpt = orderRepo.findById(currOrderId);
            if (!orderOpt.isPresent()) {
                System.out.println("Order not found for id: " + currOrderId);
                return false; // or handle according to business rules
            }
            Order currOrder = orderOpt.get();
            currOrder.setIs_completed(true);
            orderRepo.save(currOrder);

            List<OrderItem> orderItems = orderItemRepo.findByOrderId(currOrderId);

            for (OrderItem item : orderItems) {
                item.setIs_completed(true);
                Optional<Product> productOpt = productRepo.findById(item.getProduct_id());
                if (!productOpt.isPresent()) {
                    // Product not found: skip updating stock for this item (or handle as needed)
                    System.out.println("Product not found for id: " + item.getProduct_id());
                    continue;
                }
                Product product = productOpt.get();
                Integer purchasedQty = item.getQuantity() == null ? 0 : item.getQuantity();
                Integer stockQty = product.getProd_qty() == null ? 0 : product.getProd_qty();
                int stockBalance = stockQty - purchasedQty;
                product.setProd_qty(stockBalance);
                productRepo.save(product);
                orderItemRepo.save(item);
            }
            return true;
        } else {
            System.out.println(paymentStatus);
            Payment currPayment = paymentRepo.findByReference(paymentRef);
            currPayment.setStatus(myResponse.getData().getGateway_response());
            paymentRepo.save(currPayment);
            return false;
        }
    }

    @RequestMapping(path = "/verifypaydetail/{paymentRef}", method = RequestMethod.GET)
    public VerificationResponseDTO verifyMyPaymentWithDetail(@PathVariable("paymentRef") String paymentRef) {
        VerificationResponseDTO myResponse = verificationService.getPaymentWithCustomHeaders(paymentRef);

        return myResponse;
    }

}
