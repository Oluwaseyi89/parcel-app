"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, CheckCircle, Minus, Plus, ShoppingCart, Trash2, X } from "lucide-react";

import { createOrderFromCheckoutDraft, persistCartSnapshot } from "@/lib/checkoutFlow";
import { useAuth } from "@/lib/hooks/useAuth";
import { useRequireAuth } from "@/lib/hooks/useRequireAuth";
import { formatNaira, getProductModel, getProductName, getProductPhoto, getProductPrice } from "@/lib/productHelpers";
import { useCartStore } from "@/lib/stores/cartStore";
import { storage } from "@/lib/storage";
import type { CheckoutDraft, Product } from "@/lib/types";

interface CartFormState {
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

const initialFormState: CartFormState = {
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

function getCartItemQty(item: Product): number {
  return Number(item.purchased_qty ?? 1);
}

function getProductId(item: Product): number | string {
  return item.id;
}

export default function CartCheckoutView() {
  const router = useRouter();
  const { ready } = useRequireAuth();
  const { customer } = useAuth();

  const cart = useCartStore((state) => state.cart as Product[]);
  const cartTotalQty = useCartStore((state) => state.cartTotal);
  const updateCartItemQuantity = useCartStore((state) => state.updateCartItemQuantity);
  const removeFromCart = useCartStore((state) => state.removeFromCart);

  const [formState, setFormState] = useState<CartFormState>(initialFormState);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const totalPrice = useMemo(
    () => cart.reduce((total, item) => total + getProductPrice(item) * getCartItemQty(item), 0),
    [cart],
  );

  const customerName = useMemo(() => {
    const first = String(customer?.first_name ?? formState.first_name).trim();
    const last = String(customer?.last_name ?? formState.last_name).trim();
    return `${last} ${first}`.trim();
  }, [customer?.first_name, customer?.last_name, formState.first_name, formState.last_name]);

  function showSuccess(message: string) {
    setSuccessMessage(message);
    setErrorMessage("");
    window.setTimeout(() => setSuccessMessage(""), 3000);
  }

  function showError(message: string) {
    setErrorMessage(message);
    setSuccessMessage("");
    window.setTimeout(() => setErrorMessage(""), 3000);
  }

  function setField<K extends keyof CartFormState>(name: K, value: CartFormState[K]) {
    setFormState((prev) => ({ ...prev, [name]: value }));
  }

  function incrementQty(item: Product) {
    const nextQty = getCartItemQty(item) + 1;
    updateCartItemQuantity(getProductId(item), nextQty);
  }

  function decrementQty(item: Product) {
    const nextQty = Math.max(getCartItemQty(item) - 1, 1);
    updateCartItemQuantity(getProductId(item), nextQty);
  }

  function onQtyInput(item: Product, value: string) {
    const parsed = Number(value || 1);
    updateCartItemQuantity(getProductId(item), Math.max(1, parsed));
  }

  function buildCheckoutDraft(): CheckoutDraft {
    const payload = {
      customer_name: customerName,
      total_items: cartTotalQty,
      total_price: totalPrice,
      shipping_method: formState.shipping_method,
      zip_code: formState.zip_code,
      items: cart.map((item) => ({
        product_id: getProductId(item),
        product_name: getProductName(item),
        quantity: getCartItemQty(item),
        unit_price: getProductPrice(item),
      })),
      is_customer: Boolean(customer),
      customer: {
        id: customer?.id ?? null,
        first_name: String(customer?.first_name ?? formState.first_name),
        last_name: String(customer?.last_name ?? formState.last_name),
        street: String(customer?.street ?? formState.street),
        state: String(customer?.state ?? formState.state),
        country: String(customer?.country ?? formState.country),
        email: String(customer?.email ?? formState.email),
        phone_no: String(customer?.phone_no ?? formState.phone_no),
        reg_date: formState.reg_date,
      },
    };

    return {
      mode: "cart",
      customer_name: customerName,
      shipping_method: formState.shipping_method,
      zip_code: formState.zip_code,
      total_items: cartTotalQty,
      subtotal: totalPrice,
      shipping_fee: 0,
      grand_total_amount: totalPrice,
      is_customer: Boolean(customer),
      customer: payload.customer,
      items: payload.items,
    };
  }

  async function persistCartSession(draft: CheckoutDraft) {
    storage.setCheckoutDraft(draft);

    await persistCartSnapshot(draft);
  }

  async function handleSaveCart(e: React.FormEvent) {
    e.preventDefault();

    if (cart.length === 0) {
      showError("Your cart is empty.");
      return;
    }

    if (!formState.shipping_method || !formState.zip_code) {
      showError("Shipping method and zip code are required.");
      return;
    }

    const draft = buildCheckoutDraft();
    setSubmitting(true);
    try {
      await persistCartSession(draft);
      showSuccess("Cart saved successfully.");
    } catch {
      showSuccess("Cart saved locally. Server sync will be retried during checkout.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleProceedToPayment(e: React.FormEvent) {
    e.preventDefault();

    if (cart.length === 0) {
      showError("Your cart is empty.");
      return;
    }

    if (!formState.shipping_method || !formState.zip_code) {
      showError("Shipping method and zip code are required.");
      return;
    }

    const draft = buildCheckoutDraft();
    storage.setCheckoutDraft(draft);

    setSubmitting(true);
    try {
      await persistCartSession(draft);
      await createOrderFromCheckoutDraft(draft);
      showSuccess("Order prepared. Redirecting to payment.");
      router.push("/payment");
    } catch {
      showError("Unable to create order right now. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!ready) {
    return (
      <section className="min-h-screen bg-zinc-50 px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl rounded-xl border border-zinc-200 bg-white p-8 shadow-sm">
          <p className="text-zinc-500">Checking your session...</p>
        </div>
      </section>
    );
  }

  return (
    <section className="min-h-screen bg-zinc-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-danger sm:text-4xl">Cart Details</h1>
          <div className="mt-2 flex items-center justify-center text-zinc-600">
            <ShoppingCart className="mr-2 h-5 w-5" />
            <p>Review your items and complete your purchase</p>
          </div>
        </div>

        {errorMessage && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center text-red-800">
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
            <div className="flex items-center justify-between">
              <div className="flex items-center text-green-800">
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

            {cart.length > 0 ? (
              <div className="space-y-4">
                {cart.map((item) => {
                  const itemId = getProductId(item);
                  const qty = getCartItemQty(item);
                  const unitPrice = getProductPrice(item);

                  return (
                    <article key={itemId} className="rounded-xl border border-zinc-200 p-4 transition-shadow hover:shadow-md">
                      <div className="flex flex-col gap-4 sm:flex-row">
                        <div className="shrink-0">
                          <img
                            src={getProductPhoto(item) || `https://via.placeholder.com/96x96?text=${encodeURIComponent(getProductName(item))}`}
                            alt={getProductName(item)}
                            className="h-24 w-24 rounded-lg border border-zinc-200 object-cover"
                          />
                        </div>

                        <div className="grow">
                          <div className="mb-2 flex flex-col justify-between gap-2 sm:flex-row sm:items-start">
                            <div>
                              <h3 className="text-lg font-semibold text-zinc-800">{getProductName(item)}</h3>
                              <p className="text-sm text-zinc-600">{getProductModel(item)}</p>
                            </div>
                            <button
                              onClick={() => removeFromCart(itemId)}
                              className="mt-2 flex items-center rounded-lg bg-red-50 px-3 py-1.5 text-sm text-red-600 transition-colors hover:bg-red-100 sm:mt-0"
                            >
                              <Trash2 className="mr-1 h-4 w-4" /> Remove
                            </button>
                          </div>

                          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
                            <div>
                              <p className="mb-1 text-sm text-zinc-600">Price</p>
                              <p className="font-semibold text-zinc-800">{formatNaira(unitPrice)}</p>
                            </div>
                            <div>
                              <p className="mb-1 text-sm text-zinc-600">Quantity</p>
                              <div className="flex items-center">
                                <button
                                  onClick={() => decrementQty(item)}
                                  className="flex h-8 w-8 items-center justify-center rounded-l border border-zinc-300 hover:bg-zinc-50"
                                  aria-label="Decrease quantity"
                                >
                                  <Minus className="h-4 w-4" />
                                </button>
                                <input
                                  type="number"
                                  min={1}
                                  value={qty}
                                  onChange={(e) => onQtyInput(item, e.target.value)}
                                  className="h-8 w-14 border-y border-zinc-300 text-center text-sm focus:outline-none"
                                />
                                <button
                                  onClick={() => incrementQty(item)}
                                  className="flex h-8 w-8 items-center justify-center rounded-r border border-zinc-300 hover:bg-zinc-50"
                                  aria-label="Increase quantity"
                                >
                                  <Plus className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                            <div>
                              <p className="mb-1 text-sm text-zinc-600">Total</p>
                              <p className="font-semibold text-zinc-800">{formatNaira(unitPrice * qty)}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                })}

                <div className="mt-6 border-t border-zinc-200 pt-6">
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-medium text-zinc-700">Grand Total</span>
                    <span className="text-2xl font-bold text-danger">{formatNaira(totalPrice)}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center">
                <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-zinc-100">
                  <ShoppingCart className="h-12 w-12 text-zinc-400" />
                </div>
                <h3 className="mb-2 text-xl font-semibold text-zinc-700">Your cart is empty</h3>
                <p className="mb-6 text-zinc-600">Add some items to your cart to proceed.</p>
                <button
                  onClick={() => router.push("/")}
                  className="rounded-lg bg-danger px-6 py-3 font-medium text-white transition-colors hover:brightness-95"
                >
                  Browse Products
                </button>
              </div>
            )}
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-lg">
            <div className="mb-6 flex items-center">
              <div className="mr-3 h-6 w-2 rounded-full bg-danger" />
              <h2 className="text-xl font-bold text-zinc-800">Shipping Information</h2>
            </div>

            <form className="space-y-6">
              <div>
                <h3 className="mb-4 text-lg font-semibold text-zinc-700">Personal Details</h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-zinc-700">First Name</label>
                    <input
                      type="text"
                      value={String(customer?.first_name ?? formState.first_name)}
                      onChange={(e) => setField("first_name", e.target.value)}
                      className="w-full rounded-lg border border-zinc-300 px-4 py-3 transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-danger"
                      placeholder="Enter first name"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-zinc-700">Last Name</label>
                    <input
                      type="text"
                      value={String(customer?.last_name ?? formState.last_name)}
                      onChange={(e) => setField("last_name", e.target.value)}
                      className="w-full rounded-lg border border-zinc-300 px-4 py-3 transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-danger"
                      placeholder="Enter last name"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-700">Shipping Method</label>
                <select
                  value={formState.shipping_method}
                  onChange={(e) => setField("shipping_method", e.target.value)}
                  className="w-full appearance-none rounded-lg border border-zinc-300 bg-white px-4 py-3 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-danger"
                >
                  <option value="">Select shipping method</option>
                  <option value="Delivery">Delivery</option>
                  <option value="Pick up">Pick up</option>
                </select>
              </div>

              <div>
                <h3 className="mb-4 text-lg font-semibold text-zinc-700">Address Details</h3>
                <div className="space-y-4">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-zinc-700">Street Address</label>
                    <input
                      type="text"
                      value={String(customer?.street ?? formState.street)}
                      onChange={(e) => setField("street", e.target.value)}
                      className="w-full rounded-lg border border-zinc-300 px-4 py-3 transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-danger"
                      placeholder="Enter street address"
                    />
                  </div>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-sm font-medium text-zinc-700">State</label>
                      <input
                        type="text"
                        value={String(customer?.state ?? formState.state)}
                        onChange={(e) => setField("state", e.target.value)}
                        className="w-full rounded-lg border border-zinc-300 px-4 py-3 transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-danger"
                        placeholder="Enter state"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-zinc-700">Country</label>
                      <input
                        type="text"
                        value={String(customer?.country ?? formState.country)}
                        onChange={(e) => setField("country", e.target.value)}
                        className="w-full rounded-lg border border-zinc-300 px-4 py-3 transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-danger"
                        placeholder="Enter country"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-zinc-700">Zip/Postal Code</label>
                    <input
                      type="text"
                      value={formState.zip_code}
                      onChange={(e) => setField("zip_code", e.target.value)}
                      className="w-full rounded-lg border border-zinc-300 px-4 py-3 transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-danger"
                      placeholder="Enter zip code"
                    />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="mb-4 text-lg font-semibold text-zinc-700">Contact Information</h3>
                <div className="space-y-4">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-zinc-700">Email Address</label>
                    <input
                      type="email"
                      value={String(customer?.email ?? formState.email)}
                      onChange={(e) => setField("email", e.target.value)}
                      className="w-full rounded-lg border border-zinc-300 px-4 py-3 transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-danger"
                      placeholder="Enter email address"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-zinc-700">Phone Number</label>
                    <input
                      type="tel"
                      value={String(customer?.phone_no ?? formState.phone_no)}
                      onChange={(e) => setField("phone_no", e.target.value)}
                      className="w-full rounded-lg border border-zinc-300 px-4 py-3 transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-danger"
                      placeholder="Enter phone number"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4 border-t border-zinc-200 pt-6">
                <button
                  onClick={handleProceedToPayment}
                  disabled={cart.length === 0 || submitting}
                  className={`w-full rounded-lg px-6 py-3 font-medium transition-all ${
                    cart.length === 0 || submitting
                      ? "cursor-not-allowed bg-zinc-300 text-zinc-500"
                      : "bg-danger text-white hover:brightness-95"
                  }`}
                >
                  {submitting ? "Processing..." : "Proceed to Payment"}
                </button>
                <button
                  onClick={handleSaveCart}
                  disabled={cart.length === 0 || submitting}
                  className={`w-full rounded-lg border px-6 py-3 font-medium transition-all ${
                    cart.length === 0 || submitting
                      ? "cursor-not-allowed border-zinc-300 text-zinc-400"
                      : "border-danger text-danger hover:bg-red-50"
                  }`}
                >
                  Save Cart for Later
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
