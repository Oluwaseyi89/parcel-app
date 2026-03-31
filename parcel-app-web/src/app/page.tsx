"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Eye,
  Package,
  Shield,
  ShoppingCart,
  Star,
  Store,
  Tag,
  Truck,
} from "lucide-react";

import { apiRequest } from "@/lib/api";
import { useCartStore } from "@/lib/stores/cartStore";
import { useProductStore } from "@/lib/stores/productStore";
import { storage } from "@/lib/storage";
import type { Product } from "@/lib/types";

const HARDCODED_PRODUCTS: Product[] = [
  {
    id: 1,
    name: "Wireless Bluetooth Headphones",
    title: "Noise Cancelling Premium",
    price: 14999,
    description: "Premium wireless headphones with active noise cancellation and 30-hour battery life.",
    photo: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300&h=300&fit=crop",
    discount: 40,
    vendor_name: "AudioTech Store",
    vendor_photo: "https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=200&h=200&fit=crop",
    category: "electronics",
    rating: 4.5,
    stock: 25,
  },
  {
    id: 2,
    name: "Smart Watch Series 5",
    title: "Fitness & Health Tracker",
    price: 29999,
    description: "Advanced smartwatch with heart rate monitoring, GPS, and water resistance.",
    photo: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300&h=300&fit=crop",
    discount: 25,
    vendor_name: "TechGadgets NG",
    vendor_photo: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=200&h=200&fit=crop",
    category: "electronics",
    rating: 4.7,
    stock: 15,
  },
  {
    id: 3,
    name: "Organic Cotton T-Shirt",
    title: "Premium Collection",
    price: 2499,
    description: "100% organic cotton t-shirt, comfortable and eco-friendly.",
    photo: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=300&h=300&fit=crop",
    discount: 30,
    vendor_name: "EcoWear Fashion",
    vendor_photo: "https://images.unsplash.com/photo-1560883610-4bae3b844f23?w=200&h=200&fit=crop",
    category: "fashion",
    rating: 4.3,
    stock: 50,
  },
  {
    id: 4,
    name: "Stainless Steel Cookware Set",
    title: "10-Piece Kitchen Set",
    price: 18999,
    description: "Premium stainless steel cookware set with non-stick coating.",
    photo: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=300&h=300&fit=crop",
    discount: 35,
    vendor_name: "HomeEssentials",
    vendor_photo: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=200&h=200&fit=crop",
    category: "home",
    rating: 4.8,
    stock: 12,
  },
  {
    id: 5,
    name: "Professional Camera DSLR",
    title: "24MP 4K Video",
    price: 89999,
    description: "Professional DSLR camera with 24MP sensor and 4K video recording.",
    photo: "https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=300&h=300&fit=crop",
    discount: 20,
    vendor_name: "ProCamera Hub",
    vendor_photo: "https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=200&h=200&fit=crop",
    category: "electronics",
    rating: 4.9,
    stock: 8,
  },
  {
    id: 6,
    name: "Yoga Mat Premium",
    title: "Non-Slip 10mm Thick",
    price: 4999,
    description: "Eco-friendly yoga mat with non-slip surface and carrying strap.",
    photo: "https://images.unsplash.com/photo-1599901860904-17e6ed7083a0?w=300&h=300&fit=crop",
    discount: 40,
    vendor_name: "FitLife Store",
    vendor_photo: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=200&h=200&fit=crop",
    category: "sports",
    rating: 4.4,
    stock: 30,
  },
  {
    id: 7,
    name: "Designer Leather Handbag",
    title: "Classic Collection",
    price: 15999,
    description: "Genuine leather handbag with multiple compartments and adjustable strap.",
    photo: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=300&h=300&fit=crop",
    discount: 45,
    vendor_name: "LuxeBags NG",
    vendor_photo: "https://images.unsplash.com/photo-1565130838609-c3a86655db61?w=200&h=200&fit=crop",
    category: "fashion",
    rating: 4.6,
    stock: 18,
  },
  {
    id: 8,
    name: "Air Purifier HEPA Filter",
    title: "Smart Air Quality Monitor",
    price: 24999,
    description: "HEPA air purifier with smart sensors and quiet operation.",
    photo: "https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=300&h=300&fit=crop",
    discount: 30,
    vendor_name: "HealthyHome Solutions",
    vendor_photo: "https://images.unsplash.com/photo-1564069114553-7215e1ff1890?w=200&h=200&fit=crop",
    category: "home",
    rating: 4.7,
    stock: 10,
  },
];

function formatCurrency(amount: number): string {
  return `₦ ${Number(amount || 0).toLocaleString()}`;
}

function calculateDiscountPrice(price: number, discount: number): number {
  return Math.round(price * (1 - discount / 100));
}

function getProductDiscount(prod: Product): number {
  return Number(prod.discount ?? 0) || Math.floor(Math.random() * 30) + 20;
}

function getProductRating(prod: Product): number {
  return Number(prod.rating ?? 4.0) || 4.0 + Math.random() * 0.9;
}

export default function HomePage() {
  const router = useRouter();
  const products = useProductStore((state) => state.products);
  const setProducts = useProductStore((state) => state.setProducts);
  const loading = useProductStore((state) => state.loading);
  const error = useProductStore((state) => state.error);
  const addToCart = useCartStore((state) => state.addToCart);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const fetchProducts = async () => {
      const apiUrl = "/parcel_product/get_prod/";
      try {
        const data = await apiRequest<{ data?: Product[] }>(apiUrl, { method: "GET" });
        if (data && Array.isArray(data.data) && data.data.length > 0) {
          setProducts(data.data);
        } else {
          setProducts(HARDCODED_PRODUCTS);
        }
      } catch (err) {
        console.error("Error fetching products, using hardcoded data:", err);
        setProducts(HARDCODED_PRODUCTS);
      }
    };

    fetchProducts();
  }, [setProducts, mounted]);

  const handleViewProduct = (product: Product) => {
    storage.setProductView(product);
    router.push("/prod-detail");
  };

  const handleAddToCart = (product: Product) => {
    addToCart({
      ...product,
      price: Number(product.price || 0),
      purchased_qty: 1,
    });
    alert(`Added ${product.name || product.title} to cart!`);
  };

  const displayProducts = mounted && products.length > 0 ? products : HARDCODED_PRODUCTS;

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-rose-600 to-orange-500 py-12 text-white">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="text-center">
            <h1 className="text-4xl font-bold md:text-5xl">Discover Amazing Products</h1>
            <p className="mt-4 text-lg opacity-90">
              Fast delivery, great prices, and exceptional service
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <div className="flex items-center gap-2 rounded-full bg-white/20 px-4 py-2">
                <Truck className="h-5 w-5" />
                <span>Fast Delivery</span>
              </div>
              <div className="flex items-center gap-2 rounded-full bg-white/20 px-4 py-2">
                <Tag className="h-5 w-5" />
                <span>Hot Deals</span>
              </div>
              <div className="flex items-center gap-2 rounded-full bg-white/20 px-4 py-2">
                <Star className="h-5 w-5" />
                <span>Quality Guaranteed</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        {/* Status Indicator */}
        {displayProducts.length > 0 && displayProducts[0].id === 1 && (
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-yellow-100 px-4 py-2 text-sm font-medium text-yellow-800">
            <Shield className="h-4 w-4" />
            Showing demo products - Backend connection not available
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-rose-600"></div>
            <span className="ml-4 text-zinc-600">Loading products...</span>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="mb-6 flex items-center gap-2 rounded border border-red-400 bg-red-100 px-4 py-3 text-red-700">
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>Connection error - Showing demo products</span>
          </div>
        )}

        {/* Products Grid Header */}
        <div className="mb-8 flex flex-col items-start justify-between md:flex-row md:items-center">
          <div>
            <h2 className="text-2xl font-bold text-zinc-900 md:text-3xl">Featured Products</h2>
            <p className="mt-2 text-zinc-600">{displayProducts.length} amazing products waiting for you</p>
          </div>
          <div className="mt-4 flex gap-2 md:mt-0">
            <button className="rounded-lg bg-rose-600 px-4 py-2 font-medium text-white transition hover:bg-rose-700">
              All Products
            </button>
            <button className="rounded-lg border border-zinc-300 px-4 py-2 transition hover:bg-zinc-50">
              Filter
            </button>
          </div>
        </div>

        {/* Products Grid */}
        {displayProducts.length > 0 && (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {displayProducts.map((prod) => {
              const discount: number = getProductDiscount(prod);
              const originalPrice: number = Number(prod.price || 0);
              const discountPrice: number = calculateDiscountPrice(originalPrice, discount);
              const rating: number = getProductRating(prod);
              const stock: number = Number(prod.stock || 0);
              const stockStatus: string =
                stock > 0 ? (stock > 10 ? "In Stock" : `Only ${stock} left`) : "Out of Stock";
              const vendorName: string = String(prod.vendor_name || "");
              const vendorPhoto: string | null = prod.vendor_photo ? String(prod.vendor_photo) : null;
              const prodName: string = String(prod.name || "Unnamed Product");
              const prodTitle: string = String(prod.title || "Standard Model");
              const prodDescription: string = String(prod.description || "No description available.");
              const prodPhoto: string = String(prod.photo || "");
              const prodId: number | string = prod.id || 0;

              return (
                <button
                  key={prod.id}
                  onClick={() => handleViewProduct(prod)}
                  className="group overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm transition hover:shadow-lg"
                >
                  {/* Product Image */}
                  <div className="relative h-48 overflow-hidden bg-zinc-100 md:h-56">
                    <img
                      alt={prod.name || "Product"}
                      className="h-full w-full object-cover transition group-hover:scale-105"
                      src={String(prod.photo || `https://via.placeholder.com/300x300?text=${encodeURIComponent(prod.name || "Product")}`)}
                      onError={(e) => {
                        e.currentTarget.src = `https://via.placeholder.com/300x300?text=${encodeURIComponent(prod.name || "Product")}`;
                      }}
                    />

                    {/* Discount Badge */}
                    <div className="absolute right-3 top-3">
                      <span className="flex items-center gap-1 rounded-full bg-rose-600 px-3 py-1 text-sm font-bold text-white">
                        <Tag className="h-3 w-3" />
                        -{discount}%
                      </span>
                    </div>

                    {/* Stock Badge */}
                    <div className="absolute left-3 top-3">
                      <span
                        className={`rounded-full px-3 py-1 text-sm font-bold text-white ${
                          stock > 10 ? "bg-green-500" : stock > 0 ? "bg-yellow-500" : "bg-red-500"
                        }`}
                      >
                        {stockStatus}
                      </span>
                    </div>

                    {/* Quick Add Overlay */}
                    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-0 transition group-hover:bg-opacity-10">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddToCart(prod);
                        }}
                        className="translate-y-4 transform rounded-full bg-white p-3 shadow-lg transition group-hover:translate-y-0 hover:bg-rose-600 hover:text-white"
                        aria-label="Add to cart"
                      >
                        <ShoppingCart className="h-5 w-5" />
                      </button>
                    </div>
                  </div>

                  {/* Product Info */}
                  <div className="p-4 text-left">
                    {/* Name & Rating */}
                    <div className="mb-2 flex items-start justify-between">
                      <h3 className="line-clamp-1 text-lg font-bold text-zinc-900">
                        {prod.name || "Unnamed Product"}
                      </h3>
                      <div className="flex items-center">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="ml-1 text-sm text-zinc-600">{rating.toFixed(1)}</span>
                      </div>
                    </div>

                    {/* Model */}
                    <p className="mb-3 line-clamp-1 text-sm text-zinc-600">
                      {prod.title || "Standard Model"}
                    </p>

                    {/* Price */}
                    <div className="mb-3 flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xl font-bold text-zinc-900">
                            {formatCurrency(discountPrice)}
                          </span>
                          <span className="line-through text-sm text-zinc-500">
                            {formatCurrency(originalPrice)}
                          </span>
                        </div>
                        <p className="text-xs font-medium text-green-600">
                          Save {formatCurrency(originalPrice - discountPrice)}
                        </p>
                      </div>
                    </div>

                    {/* Description */}
                    <p className="mb-4 line-clamp-2 h-10 text-sm text-zinc-500">
                      {prod.description || "No description available."}
                    </p>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleViewProduct(prod)}
                        className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-rose-600 px-4 py-2 font-medium text-white transition hover:bg-rose-700"
                      >
                        <Eye className="h-4 w-4" />
                        <span>View Details</span>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddToCart(prod);
                        }}
                        className="rounded-lg border border-zinc-300 p-2 transition hover:bg-zinc-50"
                        aria-label="Add to cart"
                      >
                        <ShoppingCart className="h-5 w-5 text-zinc-600" />
                      </button>
                    </div>

                    {/* Vendor Info */}
                    {prod.vendor_name && (
                      <div className="mt-3 border-t border-zinc-100 pt-3">
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 overflow-hidden rounded-full bg-zinc-200">
                            {prod.vendor_photo ? (
                              <img
                                src={prod.vendor_photo}
                                alt={prod.vendor_name}
                                className="h-full w-full object-cover"
                                onError={(e) => {
                                  e.currentTarget.src = "https://via.placeholder.com/32x32?text=V";
                                }}
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center bg-zinc-300">
                                <Store className="h-4 w-4 text-zinc-500" />
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="text-xs text-zinc-600">Sold by</p>
                            <p className="text-sm font-medium text-zinc-800">{prod.vendor_name}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Empty State */}
        {!loading && displayProducts.length === 0 && (
          <div className="rounded-xl border border-zinc-200 bg-white py-16 text-center">
            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-zinc-100">
              <Package className="h-10 w-10 text-zinc-400" />
            </div>
            <h3 className="mb-2 text-xl font-semibold text-zinc-700">No products available</h3>
            <p className="mb-6 text-zinc-500">Check back soon or contact support</p>
            <button className="rounded-lg bg-rose-600 px-6 py-2 font-medium text-white transition hover:bg-rose-700">
              Browse Categories
            </button>
          </div>
        )}

        {/* Load More */}
        {displayProducts.length > 0 && (
          <div className="mt-12 flex justify-center">
            <button className="rounded-lg border border-rose-600 px-6 py-3 font-medium text-rose-600 transition hover:bg-rose-50">
              Load More Products
            </button>
          </div>
        )}

        {/* Features Section */}
        <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="rounded-xl border border-zinc-200 bg-white p-6">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
                <Truck className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="font-bold text-zinc-800">Fast Delivery</h3>
            </div>
            <p className="text-zinc-600">
              Get your products delivered within 24-48 hours in major cities.
            </p>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-white p-6">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100">
                <Tag className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="font-bold text-zinc-800">Best Prices</h3>
            </div>
            <p className="text-zinc-600">
              Competitive prices with regular discounts and special offers.
            </p>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-white p-6">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100">
                <Shield className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="font-bold text-zinc-800">Secure Shopping</h3>
            </div>
            <p className="text-zinc-600">
              Secure payment and buyer protection on all purchases.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
