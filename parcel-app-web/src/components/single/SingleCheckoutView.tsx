"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, CheckCircle, Mail, MapPin, Phone, ShoppingBag, User, X } from "lucide-react";

import { createOrderFromCheckoutDraft } from "@/lib/checkoutFlow";
import { useAuth } from "@/lib/hooks/useAuth";
import { formatNaira, getProductModel, getProductName, getProductPhoto, getProductPrice } from "@/lib/productHelpers";
import { storage } from "@/lib/storage";

interface SingleFormState {
  first_name: string;
  last_name: string;
  country: string;
  state: string;
  shipping_method: string;
  street: string;
  phone_no: string;
  email: string;
  zip_code: string;
  reg_date: string;
}

const initialForm: SingleFormState = {
  first_name: "",
  last_name: "",
  country: "",
  state: "",
  shipping_method: "",
  street: "",
  phone_no: "",
  email: "",
  zip_code: "",
  reg_date: new Date().toISOString(),
};

export default function SingleCheckoutView() {
  const router = useRouter();
  const { customer } = useAuth();
  const buySingle = storage.getBuySingle();

  const [form, setForm] = useState<SingleFormState>(initialForm);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const qty = Number(buySingle?.purchased_qty ?? 0);
  const unitPrice = buySingle ? Number(getProductPrice(buySingle)) : 0;
  const totalPrice = useMemo(() => unitPrice * qty, [unitPrice, qty]);

  function setField<K extends keyof SingleFormState>(name: K, value: SingleFormState[K]) {
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function updateSingleQty(value: string) {
    if (!buySingle) {
      return;
    }

    const qtyValue = Math.max(Number(value || 1), 1);
    storage.setBuySingle({ ...buySingle, purchased_qty: qtyValue });
    window.location.reload();
  }

  function showError(message: string) {
    setErrorMessage(message);
    setSuccessMessage("");
    window.setTimeout(() => setErrorMessage(""), 3000);
  }

  function showSuccess(message: string) {
    setSuccessMessage(message);
    setErrorMessage("");
    window.setTimeout(() => setSuccessMessage(""), 3000);
  }

  async function handleProceed(e: React.FormEvent) {
    e.preventDefault();

    if (!buySingle) {
      showError("No product selected for checkout.");
      return;
    }

    if (!form.shipping_method || !form.zip_code) {
      showError("Shipping method and zip code are required.");
      return;
    }

    const customerName = `${String(customer?.last_name ?? form.last_name).trim()} ${String(customer?.first_name ?? form.first_name).trim()}`.trim();

    const checkoutDraft = {
      mode: "single" as const,
      customer_name: customerName,
      shipping_method: form.shipping_method,
      zip_code: form.zip_code,
      total_items: qty,
      subtotal: totalPrice,
      shipping_fee: 0,
      grand_total_amount: totalPrice,
      is_customer: Boolean(customer),
      customer: {
        id: customer?.id ?? null,
        first_name: String(customer?.first_name ?? form.first_name),
        last_name: String(customer?.last_name ?? form.last_name),
        street: String(customer?.street ?? form.street),
        state: String(customer?.state ?? form.state),
        country: String(customer?.country ?? form.country),
        email: String(customer?.email ?? form.email),
        phone_no: String(customer?.phone_no ?? form.phone_no),
      },
      items: [
        {
          product_id: buySingle.id,
          product_name: getProductName(buySingle),
          quantity: qty,
          unit_price: unitPrice,
        },
      ],
    };

    storage.setCheckoutDraft(checkoutDraft);

    setSubmitting(true);
    try {
      await createOrderFromCheckoutDraft(checkoutDraft);
      showSuccess("Order prepared. Redirecting to payment.");
      router.push("/payment");
    } catch {
      showError("Unable to create order right now. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!buySingle) {
    return (
      <section className="min-h-screen bg-zinc-50 px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl rounded-xl border border-zinc-200 bg-white p-10 text-center shadow-sm">
          <ShoppingBag className="mx-auto h-14 w-14 text-zinc-400" />
          <h1 className="mt-4 text-2xl font-bold text-zinc-900">No product selected</h1>
          <p className="mt-2 text-zinc-600">Please choose a product to continue checkout.</p>
          <button onClick={() => router.push("/")} className="mt-6 rounded-lg bg-danger px-6 py-3 font-semibold text-white hover:brightness-95">
            Browse Products
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="min-h-screen bg-zinc-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-danger sm:text-4xl">Checkout</h1>
          <p className="mt-2 text-zinc-600">Complete your purchase for this product</p>
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

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          <div className="rounded-2xl bg-white p-6 shadow-lg">
            <div className="mb-6 flex items-center">
              <div className="mr-3 h-6 w-2 rounded-full bg-danger" />
              <h2 className="text-xl font-bold text-zinc-800">Order Summary</h2>
            </div>

            <article className="rounded-xl border border-zinc-200 p-4">
              <div className="flex flex-col gap-4 sm:flex-row">
                <img
                  src={getProductPhoto(buySingle) || `https://via.placeholder.com/128x128?text=${encodeURIComponent(getProductName(buySingle))}`}
                  alt={getProductName(buySingle)}
                  className="h-32 w-32 rounded-lg border border-zinc-200 object-cover"
                />

                <div className="grow">
                  <h3 className="text-lg font-semibold text-zinc-800">{getProductName(buySingle)}</h3>
                  <p className="text-sm text-zinc-600">{getProductModel(buySingle)}</p>

                  <div className="mt-4 grid grid-cols-2 gap-4">
                    <div>
                      <p className="mb-1 text-sm text-zinc-600">Price</p>
                      <p className="font-semibold text-zinc-800">{formatNaira(unitPrice)}</p>
                    </div>
                    <div>
                      <p className="mb-1 text-sm text-zinc-600">Quantity</p>
                      <input
                        type="number"
                        value={qty}
                        onChange={(e) => updateSingleQty(e.target.value)}
                        min={1}
                        className="w-full rounded-lg border border-zinc-300 px-3 py-1.5 text-center focus:border-transparent focus:outline-none focus:ring-2 focus:ring-danger"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </article>

            <div className="mt-6 border-t border-zinc-200 pt-6">
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold text-zinc-800">Grand Total</span>
                <span className="text-2xl font-bold text-danger">{formatNaira(totalPrice)}</span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-lg">
            <div className="mb-6 flex items-center">
              <div className="mr-3 h-6 w-2 rounded-full bg-danger" />
              <h2 className="text-xl font-bold text-zinc-800">Shipping Information</h2>
            </div>

            <form className="space-y-6" onSubmit={handleProceed}>
              <div>
                <div className="mb-4 flex items-center">
                  <User className="mr-2 h-5 w-5 text-zinc-500" />
                  <h3 className="text-lg font-semibold text-zinc-700">Personal Details</h3>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <input
                    type="text"
                    placeholder="First Name"
                    value={String(customer?.first_name ?? form.first_name)}
                    onChange={(e) => setField("first_name", e.target.value)}
                    className="w-full rounded-lg border border-zinc-300 px-4 py-3 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-danger"
                  />
                  <input
                    type="text"
                    placeholder="Last Name"
                    value={String(customer?.last_name ?? form.last_name)}
                    onChange={(e) => setField("last_name", e.target.value)}
                    className="w-full rounded-lg border border-zinc-300 px-4 py-3 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-danger"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-700">Shipping Method</label>
                <select
                  value={form.shipping_method}
                  onChange={(e) => setField("shipping_method", e.target.value)}
                  className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-3 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-danger"
                >
                  <option value="">Select shipping method</option>
                  <option value="Delivery">Delivery</option>
                  <option value="Pick up">Pick up</option>
                </select>
              </div>

              <div>
                <div className="mb-4 flex items-center">
                  <MapPin className="mr-2 h-5 w-5 text-zinc-500" />
                  <h3 className="text-lg font-semibold text-zinc-700">Address Details</h3>
                </div>
                <div className="space-y-4">
                  <input
                    type="text"
                    placeholder="Street Address"
                    value={String(customer?.street ?? form.street)}
                    onChange={(e) => setField("street", e.target.value)}
                    className="w-full rounded-lg border border-zinc-300 px-4 py-3 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-danger"
                  />
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <input
                      type="text"
                      placeholder="State"
                      value={String(customer?.state ?? form.state)}
                      onChange={(e) => setField("state", e.target.value)}
                      className="w-full rounded-lg border border-zinc-300 px-4 py-3 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-danger"
                    />
                    <input
                      type="text"
                      placeholder="Country"
                      value={String(customer?.country ?? form.country)}
                      onChange={(e) => setField("country", e.target.value)}
                      className="w-full rounded-lg border border-zinc-300 px-4 py-3 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-danger"
                    />
                  </div>
                  <input
                    type="text"
                    placeholder="Zip / Postal Code"
                    value={form.zip_code}
                    onChange={(e) => setField("zip_code", e.target.value)}
                    className="w-full rounded-lg border border-zinc-300 px-4 py-3 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-danger"
                  />
                </div>
              </div>

              <div>
                <div className="mb-4 flex items-center">
                  <Mail className="mr-2 h-5 w-5 text-zinc-500" />
                  <h3 className="text-lg font-semibold text-zinc-700">Contact Information</h3>
                </div>
                <div className="space-y-4">
                  <input
                    type="email"
                    placeholder="Email Address"
                    value={String(customer?.email ?? form.email)}
                    onChange={(e) => setField("email", e.target.value)}
                    className="w-full rounded-lg border border-zinc-300 px-4 py-3 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-danger"
                  />
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-zinc-500" />
                    <input
                      type="tel"
                      placeholder="Phone Number"
                      value={String(customer?.phone_no ?? form.phone_no)}
                      onChange={(e) => setField("phone_no", e.target.value)}
                      className="w-full rounded-lg border border-zinc-300 px-4 py-3 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-danger"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={!buySingle || submitting}
                className={`w-full rounded-lg px-6 py-3 font-medium transition-all ${
                  !buySingle || submitting ? "cursor-not-allowed bg-zinc-300 text-zinc-500" : "bg-danger text-white hover:brightness-95"
                }`}
              >
                {submitting ? "Processing..." : "Proceed to Payment"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
