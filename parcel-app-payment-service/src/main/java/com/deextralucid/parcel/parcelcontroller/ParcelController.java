package com.deextralucid.parcel.parcelcontroller;

import com.deextralucid.parcel.parcelcrud.ParcelCrud;
import com.deextralucid.parcel.parcelcrud.PaymentCrud;
import com.deextralucid.parcel.parcelmodel.PaymentDetail;
import com.deextralucid.parcel.parcelmodel.UserPayment;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.ModelAndView;

@RestController
public class ParcelController {

	@Autowired(required = true)
	UserPayment user;

	@Autowired(required = true)
	PaymentDetail paymentDetail;

	@Autowired(required = true)
	ParcelCrud parcelRepo;

	@Autowired(required = true)
	PaymentCrud paymentRepo;

	@RequestMapping("home")
	public ModelAndView home() {
		ModelAndView mv = new ModelAndView();
		mv.setViewName("sample");
		return mv;
		// System.out.println("hello parcel");
		// return "<h1>Hello from Parcel_App</h1>";
	}

	@RequestMapping("payment")
	public ModelAndView payment() {
		ModelAndView mv = new ModelAndView();
		mv.setViewName("process_payment");
		return mv;
		// System.out.println("hello parcel");
		// return "<h1>Hello from Parcel_App</h1>";
	}

	@PostMapping("/submitPayer")
	@ResponseBody
	public String submitPayer(UserPayment user) {
		String email = user.getEmail();
		String firstName = user.getFirstName();
		String lastName = user.getLastName();
		UserPayment exitUser = parcelRepo.findByEmail(email);
		if (email != "" && firstName != "" && lastName != "") {
			if (exitUser == null) {
				parcelRepo.save(user);
				return "<h1>User Saved!</h1>";
			} else {
				return "<h1>User Already Exists!</h1>";
			}
		} else {
			System.out.println(exitUser);
			return "<h1>Fill the blank fields</h1>";
		}
	}

	@RequestMapping(value = "/make_payment", method = RequestMethod.POST, consumes = MediaType.APPLICATION_JSON_VALUE)

	public PaymentDetail processPayment(@RequestBody PaymentDetail paymentDetail) {

		System.out.println(paymentDetail.getOrderId());
		System.out.println(paymentDetail.getCustomerId());
		System.out.println(paymentDetail.getCustomerName());
		System.out.println(paymentDetail.getPaymentType());
		System.out.println(paymentDetail.getProvider());
		System.out.println(paymentDetail.getAmount());
		System.out.println(paymentDetail.getCreatedAt());
		System.out.println(paymentDetail.getUpdatedAt());
		System.out.println(paymentDetail.getIsCustomer());
		System.out.println(paymentDetail.getStatus());
		paymentRepo.save(paymentDetail);
		return paymentDetail;
		// return "<h1>Payment processed successfully</h1>";
	}

	@RequestMapping("paystack_page")
	public ModelAndView paystack() {
		ModelAndView mv = new ModelAndView();
		mv.setViewName("paystack_form");
		return mv;
	}

}
