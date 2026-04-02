"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Building, CheckCircle, CreditCard, Loader2, Truck, X } from "lucide-react";

import { env } from "@/env";
import { apiRequest } from "@/lib/api";
import { ensureOrderFromDraft } from "@/lib/checkoutFlow";
import { formatNaira } from "@/lib/productHelpers";
import { storage } from "@/lib/storage";

interface PaymentFormState {
  payment_type: string;
  shipping_pay_type: string;
  provider: string;
  shipping_provider: string;
  txn_ref: string;
  shipping_txn_ref: string;
}

interface PaymentInitiateResponse {
  status?: string;
  message?: string;
  data?: {
    payment?: {
      reference?: string;
    };
  };
  errors?: unknown;
}

const initialState: PaymentFormState = {
  payment_type: "",
  shipping_pay_type: "",
  provider: "",
  shipping_provider: "",
  txn_ref: "",
  shipping_txn_ref: "",
};

export default function PaymentView() {
  const router = useRouter();
  const checkoutDraft = storage.getCheckoutDraft();

  const [form, setForm] = useState<PaymentFormState>(initialState);
  const [processing, setProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const amount = useMemo(() => Number(checkoutDraft?.subtotal ?? 0), [checkoutDraft]);
  const shippingFee = useMemo(() => Number(checkoutDraft?.shipping_fee ?? 0), [checkoutDraft]);
  const grandTotal = useMemo(() => Number(checkoutDraft?.grand_total_amount ?? amount + shippingFee), [checkoutDraft, amount, shippingFee]);

  useEffect(() => {
    if (!checkoutDraft) {
      setErrorMessage("No checkout details found. Please return to cart and try again.");
    }
  }, [checkoutDraft]);

  function setField<K extends keyof PaymentFormState>(name: K, value: PaymentFormState[K]) {
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function showError(message: string) {
    setErrorMessage(message);
    setSuccessMessage("");
    window.setTimeout(() => setErrorMessage(""), 4000);
  }

  function showSuccess(message: string) {
    setSuccessMessage(message);
    setErrorMessage("");
    window.setTimeout(() => setSuccessMessage(""), 4000);
  }

  function normalizePaymentMethod(value: string): "card" | "bank_transfer" | "cash_on_delivery" {
    const paymentType = value.toLowerCase();
    if (paymentType.includes("card")) return "card";
    if (paymentType.includes("bank transfer")) return "bank_transfer";
    return "cash_on_delivery";
  }

  async function initiateOrderPayment(paymentType: string) {
    const currentOrder = await ensureOrderFromDraft(checkoutDraft);
    const numericOrderId = Number(currentOrder);

    if (!Number.isFinite(numericOrderId)) {
      throw new Error("Invalid order id for payment initialization.");
    }

    const response = await apiRequest<PaymentInitiateResponse>("/order/payments/initiate/", {
      method: "POST",
      body: {
        order_id: numericOrderId,
        payment_method: normalizePaymentMethod(paymentType),
        save_card: false,
      },
      json: true,
    });

    if (String(response.status ?? "").toLowerCase() !== "success") {
      throw new Error(String(response.message ?? "Unable to initialize order payment."));
    }

    const backendReference = response.data?.payment?.reference;
    if (backendReference) {
      storage.setPaymentReference(backendReference);
    }
  }

  async function handleCardPayment(e: React.FormEvent) {
    e.preventDefault();

    if (!checkoutDraft) {
      showError("Missing checkout details.");
      return;
    }

    if (!form.provider) {
      showError("Please choose a card provider.");
      return;
    }

    setProcessing(true);
    showSuccess("Processing your payment...");

    try {
      const email = checkoutDraft.customer?.email || "customer@example.com";
      const callbackUrl = `${window.location.origin}/verify`;
      const payload = {
        email,
        amount: Math.round(grandTotal * 100),
        callback_url: callbackUrl,
      };

      const response = await fetch(`${env.paymentApiBase}/v1/initializetransaction`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Payment initialization failed (${response.status})`);
      }

      const data = (await response.json()) as { data?: { authorization_url?: string; reference?: string } };
      const reference = data?.data?.reference ?? `local-${Date.now()}`;
      storage.setPaymentReference(reference);
      await initiateOrderPayment(form.payment_type || "Card Payment");

      const redirectUrl = data?.data?.authorization_url;
      if (redirectUrl) {
        window.location.href = redirectUrl;
        return;
      }

      showError("Unable to reach payment gateway. A local reference has been created for retry.");
      router.push("/verify");
    } catch {
      const fallbackReference = `local-${Date.now()}`;
      storage.setPaymentReference(fallbackReference);
      try {
        await initiateOrderPayment(form.payment_type || "Card Payment");
        showError("Unable to reach payment gateway. A local reference has been created for retry.");
        router.push("/verify");
      } catch {
        showError("Unable to initialize payment. Please try again.");
      }
    } finally {
      setProcessing(false);
    }
  }

  async function handleBankTransfer(e: React.FormEvent) {
    e.preventDefault();

    if (!form.txn_ref) {
      showError("Please enter your transaction reference.");
      return;
    }

    setProcessing(true);
    try {
      storage.setPaymentReference(form.txn_ref);
      await initiateOrderPayment(form.payment_type || "Bank Transfer");
      showSuccess("Bank transfer reference recorded.");
      router.push("/verify");
    } catch {
      showError("Unable to record reference. Please try again.");
    } finally {
      setProcessing(false);
    }
  }

  async function handleShippingOnly(e: React.FormEvent) {
    e.preventDefault();

    if (!form.shipping_pay_type) {
      showError("Please choose shipping fee payment type.");
      return;
    }

    if (form.shipping_pay_type === "Bank Transfer for Shipping" && !form.shipping_txn_ref) {
      showError("Please enter shipping transfer reference.");
      return;
    }

    const shippingRef = form.shipping_txn_ref || `shipping-${Date.now()}`;

    setProcessing(true);
    try {
      storage.setPaymentReference(shippingRef);
      await initiateOrderPayment(form.shipping_pay_type || "Bank Transfer for Shipping");
      showSuccess("Shipping payment recorded. Continue to final verification.");
      router.push("/verify");
    } catch {
      showError("Unable to save shipping payment details.");
    } finally {
      setProcessing(false);
    }
  }

  if (!checkoutDraft) {
    return (
      <section className="min-h-screen bg-zinc-50 px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl rounded-xl border border-zinc-200 bg-white p-8 shadow-sm">
          <p className="text-zinc-700">No checkout details found.</p>
          <button onClick={() => router.push("/cart-check")} className="mt-4 rounded-lg bg-danger px-5 py-2.5 font-medium text-white">
            Return to cart
          </button>
        </div>
      </section>
    );
  }

  const showProvider = form.payment_type === "Card Payment";
  const showTxnRef = form.payment_type === "Bank Transfer";
  const showPayDeliv = form.payment_type === "Bank Transfer On Delivery";
  const showShipProv = form.shipping_pay_type === "Card Payment for Shipping";
  const showShipTxnRef = form.shipping_pay_type === "Bank Transfer for Shipping";

  return (
    <section className="min-h-screen bg-zinc-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-danger">Complete Your Payment</h1>
          <p className="mt-2 text-zinc-600">Review your order summary and choose a payment method</p>
        </div>

        {errorMessage && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4">
            <div className="flex items-center justify-between text-red-800">
              <div className="flex items-center">
                <AlertCircle className="mr-2 h-5 w-5" />
                <p className="font-medium">{errorMessage}</p>
              </div>
              <button onClick={() => setErrorMessage("")} className="text-red-600 hover:text-red-800">
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}

        {successMessage && (
          <div className="mb-6 rounded-xl border border-green-200 bg-green-50 p-4">
            <div className="flex items-center justify-between text-green-800">
              <div className="flex items-center">
                <CheckCircle className="mr-2 h-5 w-5" />
                <p className="font-medium">{successMessage}</p>
              </div>
              <button onClick={() => setSuccessMessage("")} className="text-green-600 hover:text-green-800">
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}

        <div className="mb-8 rounded-2xl bg-white p-6 shadow-lg">
          <h2 className="mb-6 flex items-center text-xl font-bold text-zinc-800">
            <div className="mr-3 h-6 w-2 rounded-full bg-danger" />
            Order Summary
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-100 py-3">
              <span className="text-zinc-600">Subtotal</span>
              <span className="font-semibold text-zinc-800">{formatNaira(amount)}</span>
            </div>
            <div className="flex items-center justify-between border-b border-zinc-100 py-3">
              <span className="text-zinc-600">Shipping Fee</span>
              <span className="font-semibold text-zinc-800">{formatNaira(shippingFee)}</span>
            </div>
            <div className="flex items-center justify-between py-3">
              <span className="text-lg font-bold text-zinc-800">Grand Total</span>
              <span className="text-2xl font-bold text-danger">{formatNaira(grandTotal)}</span>
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-lg">
          <h2 className="mb-6 flex items-center text-xl font-bold text-zinc-800">
            <div className="mr-3 h-6 w-2 rounded-full bg-danger" />
            Select Payment Method
          </h2>

          <form className="space-y-6">
            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-700">Payment Type</label>
              <select
                value={form.payment_type}
                onChange={(e) => setField("payment_type", e.target.value)}
                className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-3 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-danger"
              >
                <option value="">Select Payment Type</option>
                <option value="Card Payment">Card Payment</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Bank Transfer On Delivery">Bank Transfer On Delivery</option>
              </select>
            </div>

            {showProvider && (
              <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-5">
                <div className="mb-4 flex items-center">
                  <CreditCard className="mr-2 h-5 w-5 text-danger" />
                  <h3 className="font-semibold text-zinc-800">Card Payment Details</h3>
                </div>
                <select
                  value={form.provider}
                  onChange={(e) => setField("provider", e.target.value)}
                  className="mb-4 w-full rounded-lg border border-zinc-300 bg-white px-4 py-3 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-danger"
                >
                  <option value="">Select Provider</option>
                  <option value="Master Card">Master Card</option>
                  <option value="Verve Card">Verve Card</option>
                  <option value="Visa Card">Visa Card</option>
                </select>
                <button
                  type="submit"
                  onClick={handleCardPayment}
                  disabled={processing || !form.provider}
                  className={`flex w-full items-center justify-center rounded-lg px-6 py-3 font-medium transition-all ${
                    processing || !form.provider ? "cursor-not-allowed bg-zinc-300 text-zinc-500" : "bg-danger text-white hover:brightness-95"
                  }`}
                >
                  {processing ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Processing...</> : "Proceed to Payment"}
                </button>
              </div>
            )}

            {showTxnRef && (
              <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-5">
                <div className="mb-4 flex items-center">
                  <Building className="mr-2 h-5 w-5 text-danger" />
                  <h3 className="font-semibold text-zinc-800">Bank Transfer Details</h3>
                </div>
                <div className="mb-4 rounded-lg border border-zinc-200 bg-white p-4">
                  <p className="text-sm text-zinc-600">Account Number</p>
                  <p className="font-mono text-lg font-bold text-zinc-800">3073566093</p>
                  <p className="mt-2 text-sm text-zinc-600">Bank Name: First Bank</p>
                </div>
                <input
                  value={form.txn_ref}
                  onChange={(e) => setField("txn_ref", e.target.value)}
                  placeholder="Enter transaction reference"
                  className="mb-4 w-full rounded-lg border border-zinc-300 px-4 py-3 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-danger"
                />
                <button
                  type="submit"
                  onClick={handleBankTransfer}
                  disabled={processing || !form.txn_ref}
                  className={`w-full rounded-lg px-6 py-3 font-medium transition-all ${
                    processing || !form.txn_ref ? "cursor-not-allowed bg-zinc-300 text-zinc-500" : "bg-danger text-white hover:brightness-95"
                  }`}
                >
                  Submit Payment Confirmation
                </button>
              </div>
            )}

            {showPayDeliv && (
              <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-5">
                <div className="mb-4 flex items-center">
                  <Truck className="mr-2 h-5 w-5 text-danger" />
                  <h3 className="font-semibold text-zinc-800">Payment On Delivery</h3>
                </div>
                <select
                  value={form.shipping_pay_type}
                  onChange={(e) => setField("shipping_pay_type", e.target.value)}
                  className="mb-4 w-full rounded-lg border border-zinc-300 bg-white px-4 py-3 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-danger"
                >
                  <option value="">Select Shipping Fee Payment Type</option>
                  <option value="Card Payment for Shipping">Card Payment for Shipping</option>
                  <option value="Bank Transfer for Shipping">Bank Transfer for Shipping</option>
                </select>

                {showShipProv && (
                  <select
                    value={form.shipping_provider}
                    onChange={(e) => setField("shipping_provider", e.target.value)}
                    className="mb-4 w-full rounded-lg border border-zinc-300 bg-white px-4 py-3 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-danger"
                  >
                    <option value="">Select Provider</option>
                    <option value="Master Card">Master Card</option>
                    <option value="Verve Card">Verve Card</option>
                    <option value="Visa Card">Visa Card</option>
                  </select>
                )}

                {showShipTxnRef && (
                  <input
                    value={form.shipping_txn_ref}
                    onChange={(e) => setField("shipping_txn_ref", e.target.value)}
                    placeholder="Enter shipping transfer reference"
                    className="mb-4 w-full rounded-lg border border-zinc-300 px-4 py-3 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-danger"
                  />
                )}

                <button
                  type="submit"
                  onClick={handleShippingOnly}
                  disabled={processing}
                  className={`w-full rounded-lg px-6 py-3 font-medium transition-all ${
                    processing ? "cursor-not-allowed bg-zinc-300 text-zinc-500" : "bg-danger text-white hover:brightness-95"
                  }`}
                >
                  Confirm Shipping Payment
                </button>
              </div>
            )}
          </form>
        </div>
      </div>
    </section>
  );
}
