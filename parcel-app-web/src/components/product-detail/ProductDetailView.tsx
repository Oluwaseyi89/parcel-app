"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle,
  ChevronLeft,
  Minus,
  Package,
  Plus,
  Shield,
  ShoppingCart,
  Star,
  Tag,
  Truck,
  User,
} from "lucide-react";

import { demoProducts } from "@/lib/demoProducts";
import {
  formatNaira,
  getDiscountedPrice,
  getProductDescription,
  getProductDiscount,
  getProductModel,
  getProductName,
  getProductPhoto,
  getProductPrice,
  getProductRating,
  getProductStock,
} from "@/lib/productHelpers";
import { useCartStore } from "@/lib/stores/cartStore";
import { useProductStore } from "@/lib/stores/productStore";
import { storage } from "@/lib/storage";
import type { Product } from "@/lib/types";

function productImageFallback(name: string): string {
  return `https://via.placeholder.com/600x600?text=${encodeURIComponent(name)}`;
}

export default function ProductDetailView() {
  const router = useRouter();
  const selectedProduct = useProductStore((state) => state.selectedProduct);
  const setSelectedProduct = useProductStore((state) => state.setSelectedProduct);
  const cart = useCartStore((state) => state.cart);
  const addToCart = useCartStore((state) => state.addToCart);
  const removeFromCart = useCartStore((state) => state.removeFromCart);

  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    if (!selectedProduct) {
      const fromStorage = storage.getProductView();
      if (fromStorage) {
        setSelectedProduct(fromStorage);
      }
    }
  }, [selectedProduct, setSelectedProduct]);

  const product = useMemo<Product | null>(() => {
    if (selectedProduct) {
      return selectedProduct;
    }

    const fromStorage = storage.getProductView();
    if (fromStorage) {
      return fromStorage;
    }

    return demoProducts[0] ?? null;
  }, [selectedProduct]);

  const stock = product ? Math.max(getProductStock(product), 1) : 0;
  const isInCart = Boolean(product && cart.some((item) => item.id === product.id));

  useEffect(() => {
    if (!product) {
      return;
    }

    const cartItem = cart.find((item) => item.id === product.id);
    if (cartItem && Number(cartItem.purchased_qty) > 0) {
      setQuantity(Number(cartItem.purchased_qty));
      return;
    }

    setQuantity(1);
  }, [cart, product]);

  function showSuccess(message: string) {
    setSuccessMessage(message);
    setErrorMessage("");
    window.setTimeout(() => setSuccessMessage(""), 2500);
  }

  function showError(message: string) {
    setErrorMessage(message);
    setSuccessMessage("");
    window.setTimeout(() => setErrorMessage(""), 2500);
  }

  function incrementQty() {
    setQuantity((prev) => Math.min(prev + 1, stock));
  }

  function decrementQty() {
    setQuantity((prev) => Math.max(prev - 1, 1));
  }

  function handleAddToCart() {
    if (!product) {
      showError("Product is unavailable.");
      return;
    }

    addToCart({
      ...product,
      id: product.id,
      price: getProductPrice(product),
      purchased_qty: quantity,
    });
    showSuccess("Product added to cart successfully.");
  }

  function handleRemoveFromCart() {
    if (!product) {
      showError("Product is unavailable.");
      return;
    }

    removeFromCart(product.id);
    setQuantity(1);
    showSuccess("Product removed from cart.");
  }

  function handleBuyNow() {
    if (!product) {
      showError("Product is unavailable.");
      return;
    }

    storage.setBuySingle({
      ...product,
      id: product.id,
      price: getProductPrice(product),
      purchased_qty: quantity,
    });
    router.push("/single");
  }

  if (!product) {
    return (
      <section className="min-h-screen bg-zinc-50 px-6 py-20">
        <div className="mx-auto max-w-3xl rounded-2xl border border-zinc-200 bg-white p-10 text-center shadow-sm">
          <Package className="mx-auto h-14 w-14 text-zinc-400" />
          <h1 className="mt-4 text-2xl font-bold text-zinc-900">Product not found</h1>
          <p className="mt-2 text-zinc-600">The selected product is unavailable.</p>
          <button
            onClick={() => router.push("/")}
            className="mt-6 rounded-lg bg-danger px-6 py-3 font-semibold text-white hover:brightness-95"
          >
            Browse products
          </button>
        </div>
      </section>
    );
  }

  const name = getProductName(product);
  const model = getProductModel(product);
  const description = getProductDescription(product);
  const photo = getProductPhoto(product) || productImageFallback(name);
  const rating = getProductRating(product);
  const discount = getProductDiscount(product);
  const price = getProductPrice(product);
  const discountedPrice = getDiscountedPrice(product);

  return (
    <section className="min-h-screen bg-zinc-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <button onClick={() => router.back()} className="mb-6 flex items-center text-zinc-600 hover:text-zinc-900">
          <ChevronLeft className="mr-1 h-5 w-5" /> Back to products
        </button>

        {errorMessage && (
          <div className="mb-6 rounded-r border-l-4 border-red-400 bg-red-50 p-4 text-sm text-red-700">{errorMessage}</div>
        )}

        {successMessage && (
          <div className="mb-6 flex items-center rounded-r border-l-4 border-green-500 bg-green-50 p-4 text-sm text-green-700">
            <CheckCircle className="mr-2 h-5 w-5" /> {successMessage}
          </div>
        )}

        <div className="overflow-hidden rounded-2xl bg-white shadow-lg">
          <div className="flex flex-col lg:flex-row">
            <div className="p-8 lg:w-1/2">
              <div className="relative">
                <img
                  alt={name}
                  className="h-auto w-full rounded-xl object-cover shadow-md"
                  src={photo}
                  onError={(event) => {
                    event.currentTarget.src = productImageFallback(name);
                  }}
                />
                <span className="absolute left-4 top-4 rounded-full bg-green-500 px-4 py-2 text-sm font-bold text-white">
                  {stock > 10 ? "In Stock" : `Only ${stock} left`}
                </span>
                <span className="absolute right-4 top-4 flex items-center rounded-full bg-danger px-4 py-2 text-sm font-bold text-white">
                  <Tag className="mr-1 h-3 w-3" /> -{discount}%
                </span>
              </div>
            </div>

            <div className="border-zinc-100 p-8 lg:w-1/2 lg:border-l">
              <div className="mb-6">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-widest text-zinc-500">{String(product.category || "General")}</span>
                  <div className="flex items-center">
                    <Star className="h-5 w-5 fill-current text-yellow-400" />
                    <span className="ml-2 font-semibold text-zinc-800">{rating.toFixed(1)}</span>
                  </div>
                </div>
                <h1 className="text-3xl font-bold text-zinc-900">{name}</h1>
                <h2 className="mt-2 text-xl text-zinc-600">{model}</h2>
              </div>

              <div className="mb-8">
                <div className="flex items-center gap-3">
                  <span className="text-4xl font-bold text-zinc-900">{formatNaira(discountedPrice)}</span>
                  <span className="text-xl text-zinc-500 line-through">{formatNaira(price)}</span>
                </div>
                <p className="mt-2 text-sm font-semibold text-green-600">
                  Save {formatNaira(price - discountedPrice)} ({discount}% off)
                </p>
              </div>

              <div className="mb-8">
                <h3 className="mb-2 text-lg font-semibold text-zinc-800">Description</h3>
                <p className="leading-relaxed text-zinc-600">{description}</p>
              </div>

              <div className="mb-8">
                <h3 className="mb-3 text-lg font-semibold text-zinc-800">Quantity</h3>
                <div className="flex items-center">
                  <button
                    onClick={decrementQty}
                    disabled={quantity <= 1}
                    className="flex h-12 w-12 items-center justify-center rounded-l-lg border border-zinc-300 hover:bg-zinc-50 disabled:opacity-50"
                  >
                    <Minus className="h-5 w-5" />
                  </button>
                  <div className="flex h-12 w-20 items-center justify-center border-y border-zinc-300 font-semibold">{quantity}</div>
                  <button
                    onClick={incrementQty}
                    disabled={quantity >= stock}
                    className="flex h-12 w-12 items-center justify-center rounded-r-lg border border-zinc-300 hover:bg-zinc-50 disabled:opacity-50"
                  >
                    <Plus className="h-5 w-5" />
                  </button>
                  <span className="ml-4 text-sm text-zinc-600">{stock} available</span>
                </div>
              </div>

              {product.vendor_name && (
                <div className="mb-8 rounded-lg bg-zinc-50 p-4">
                  <h3 className="mb-3 text-lg font-semibold text-zinc-800">Sold by</h3>
                  <div className="flex items-center">
                    <div className="mr-4 h-12 w-12 overflow-hidden rounded-full bg-zinc-300">
                      {product.vendor_photo ? (
                        <img alt={String(product.vendor_name)} src={String(product.vendor_photo)} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <User className="h-6 w-6 text-zinc-500" />
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-zinc-800">{String(product.vendor_name)}</p>
                      <p className="text-sm text-zinc-500">Verified Seller</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <div className="flex flex-col gap-4 sm:flex-row">
                  <button
                    onClick={handleBuyNow}
                    className="flex flex-1 items-center justify-center rounded-lg bg-danger px-6 py-4 text-lg font-bold text-white hover:brightness-95"
                  >
                    <ShoppingCart className="mr-2 h-5 w-5" /> Buy Now
                  </button>
                  {isInCart ? (
                    <button
                      onClick={handleRemoveFromCart}
                      className="flex-1 rounded-lg border-2 border-danger px-6 py-4 text-lg font-bold text-danger hover:bg-red-50"
                    >
                      Remove from Cart
                    </button>
                  ) : (
                    <button
                      onClick={handleAddToCart}
                      className="flex-1 rounded-lg border-2 border-danger px-6 py-4 text-lg font-bold text-danger hover:bg-red-50"
                    >
                      Add to Cart
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-4">
          <div className="rounded-xl border border-zinc-200 bg-white p-5">
            <div className="mb-2 flex items-center text-blue-600">
              <Truck className="mr-2 h-6 w-6" />
              <h4 className="font-semibold text-zinc-800">Free Shipping</h4>
            </div>
            <p className="text-sm text-zinc-600">Free delivery on orders over ₦10,000.</p>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-white p-5">
            <div className="mb-2 flex items-center text-green-600">
              <Shield className="mr-2 h-6 w-6" />
              <h4 className="font-semibold text-zinc-800">Secure Payment</h4>
            </div>
            <p className="text-sm text-zinc-600">Protected checkout and safe transactions.</p>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-white p-5">
            <div className="mb-2 flex items-center text-violet-600">
              <CheckCircle className="mr-2 h-6 w-6" />
              <h4 className="font-semibold text-zinc-800">Warranty</h4>
            </div>
            <p className="text-sm text-zinc-600">Includes standard warranty support.</p>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-white p-5">
            <div className="mb-2 flex items-center text-amber-600">
              <Star className="mr-2 h-6 w-6" />
              <h4 className="font-semibold text-zinc-800">Customer Support</h4>
            </div>
            <p className="text-sm text-zinc-600">Help available when you need it.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
