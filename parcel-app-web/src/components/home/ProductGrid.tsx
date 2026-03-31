"use client";

import { useEffect } from "react";
import { Eye, Package, ShoppingCart, Shield, Star, Store, Tag, Truck } from "lucide-react";
import { useRouter } from "next/navigation";

import { env } from "@/env";
import { demoProducts } from "@/lib/demoProducts";
import { storage } from "@/lib/storage";
import { useCartStore } from "@/lib/stores/cartStore";
import { useProductStore } from "@/lib/stores/productStore";
import type { Product } from "@/lib/types";
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

function productImageFallback(name: string): string {
  return `https://via.placeholder.com/300x300?text=${encodeURIComponent(name)}`;
}

export default function ProductGrid() {
  const router = useRouter();
  const { products, setProducts, loading, error, setLoading, setError, setSelectedProduct } = useProductStore();
  const addToCart = useCartStore((state) => state.addToCart);

  async function loadProducts() {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${env.apiBase}/parcel_product/get_prod/`, {
        method: "GET",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch products: ${response.status}`);
      }

      const data = (await response.json()) as { data?: Product[] } | Product[];
      const resolvedProducts = Array.isArray(data) ? data : data.data;
      if (resolvedProducts && resolvedProducts.length > 0) {
        setProducts(resolvedProducts);
      } else {
        setProducts(demoProducts);
      }
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : "Failed to fetch products.");
      setProducts(demoProducts);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (products.length === 0) {
      void loadProducts();
    }
  }, [products.length, setError, setLoading, setProducts]);

  function handleViewProduct(product: Product) {
    storage.setProductView(product);
    setSelectedProduct(product);
    router.push("/prod-detail");
  }

  function handleAddToCart(product: Product, event: React.MouseEvent<HTMLButtonElement>) {
    event.stopPropagation();
    addToCart({
      ...product,
      id: product.id,
      price: getProductPrice(product),
      purchased_qty: 1,
    });
  }

  const showDemoBadge = products.length > 0 && products.every((product) => Number(product.id) <= 8);

  return (
    <div className="min-h-screen bg-background">
      <section className="bg-linear-to-r from-danger to-orange-500 py-14 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold md:text-5xl">Discover Amazing Products</h1>
            <p className="mt-4 text-lg opacity-90 md:text-xl">Fast delivery, great prices, and exceptional service</p>
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

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {showDemoBadge && (
          <div className="mb-6 inline-flex items-center rounded-full bg-amber-100 px-4 py-2 text-sm font-medium text-amber-800">
            <Shield className="mr-2 h-4 w-4" />
            Showing demo products while backend data is unavailable
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-danger" />
            <span className="ml-4 text-zinc-600">Loading products...</span>
          </div>
        )}

        {error && !loading && (
          <div className="mb-6 rounded border border-red-300 bg-red-50 px-4 py-3 text-red-700">
            Connection issue detected. Falling back to demo products.
          </div>
        )}

        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-zinc-800 md:text-3xl">Featured Products</h2>
            <p className="mt-2 text-zinc-600">{products.length} products currently available</p>
          </div>
          <div className="flex gap-2">
            <button className="rounded-lg bg-danger px-4 py-2 font-medium text-white transition hover:bg-red-600">All Products</button>
            <button className="rounded-lg border border-zinc-300 px-4 py-2 transition hover:bg-zinc-50">Filter</button>
          </div>
        </div>

        {products.length > 0 && (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {products.map((product) => {
              const name = getProductName(product);
              const stock = getProductStock(product);
              const rating = getProductRating(product);
              const price = getProductPrice(product);
              const discount = getProductDiscount(product);
              const discountPrice = getDiscountedPrice(product);
              const stockStatus = stock > 0 ? (stock > 10 ? "In Stock" : `Only ${stock} left`) : "Out of Stock";

              return (
                <article
                  key={product.id}
                  className="group cursor-pointer overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg"
                  onClick={() => handleViewProduct(product)}
                >
                  <div className="relative h-52 overflow-hidden bg-zinc-100 md:h-56">
                    <img
                      alt={name}
                      className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                      src={getProductPhoto(product) || productImageFallback(name)}
                      onError={(event) => {
                        event.currentTarget.src = productImageFallback(name);
                      }}
                    />
                    <div className="absolute left-3 top-3">
                      <span className={`rounded-full px-3 py-1 text-sm font-bold text-white ${stock > 10 ? "bg-green-500" : stock > 0 ? "bg-amber-500" : "bg-red-500"}`}>
                        {stockStatus}
                      </span>
                    </div>
                    <div className="absolute right-3 top-3">
                      <span className="flex items-center rounded-full bg-danger px-3 py-1 text-sm font-bold text-white">
                        <Tag className="mr-1 h-3 w-3" />-{discount}%
                      </span>
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition group-hover:bg-black/10 group-hover:opacity-100">
                      <button
                        onClick={(event) => handleAddToCart(product, event)}
                        className="translate-y-4 rounded-full bg-white p-3 text-danger shadow-lg transition group-hover:translate-y-0 hover:bg-danger hover:text-white"
                        aria-label={`Add ${name} to cart`}
                      >
                        <ShoppingCart className="h-5 w-5" />
                      </button>
                    </div>
                  </div>

                  <div className="p-4">
                    <div className="mb-2 flex items-start justify-between gap-3">
                      <h3 className="line-clamp-1 text-lg font-bold text-zinc-800">{name}</h3>
                      <div className="flex items-center">
                        <Star className="h-4 w-4 fill-current text-yellow-400" />
                        <span className="ml-1 text-sm text-zinc-600">{rating.toFixed(1)}</span>
                      </div>
                    </div>

                    <p className="mb-3 line-clamp-1 text-sm text-zinc-600">{getProductModel(product)}</p>

                    <div className="mb-4 flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xl font-bold text-zinc-900">{formatNaira(discountPrice)}</span>
                          <span className="text-sm text-zinc-500 line-through">{formatNaira(price)}</span>
                        </div>
                        <p className="text-xs font-medium text-green-600">Save {formatNaira(price - discountPrice)}</p>
                      </div>
                    </div>

                    <p className="mb-4 line-clamp-2 min-h-10 text-sm text-zinc-500">{getProductDescription(product)}</p>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleViewProduct(product)}
                        className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-danger px-4 py-2 font-medium text-white transition hover:bg-red-600"
                      >
                        <Eye className="h-4 w-4" />
                        <span>View Details</span>
                      </button>
                      <button
                        onClick={(event) => handleAddToCart(product, event)}
                        className="rounded-lg border border-zinc-300 p-2 transition hover:bg-zinc-50"
                        aria-label={`Quick add ${name}`}
                      >
                        <ShoppingCart className="h-5 w-5 text-zinc-600" />
                      </button>
                    </div>

                    {product.vendor_name && (
                      <div className="mt-3 border-t border-zinc-100 pt-3">
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 overflow-hidden rounded-full bg-zinc-200">
                            {product.vendor_photo ? (
                              <img
                                alt={String(product.vendor_name)}
                                className="h-full w-full object-cover"
                                src={String(product.vendor_photo)}
                                onError={(event) => {
                                  event.currentTarget.src = "https://via.placeholder.com/32x32?text=V";
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
                            <p className="text-sm font-medium text-zinc-800">{String(product.vendor_name)}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {!loading && products.length === 0 && (
          <div className="rounded-xl border border-zinc-200 bg-white py-16 text-center">
            <div className="mb-6 inline-flex h-20 w-20 items-center justify-center rounded-full bg-zinc-100">
              <Package className="h-10 w-10 text-zinc-400" />
            </div>
            <h3 className="mb-2 text-xl font-semibold text-zinc-700">No products available</h3>
            <p className="mb-6 text-zinc-500">Check back soon or contact support.</p>
            <button className="rounded-lg bg-danger px-6 py-2 font-medium text-white transition hover:bg-red-600">Browse Categories</button>
          </div>
        )}

        {products.length > 0 && (
          <div className="mt-12 flex justify-center">
            <button className="rounded-lg border border-danger px-6 py-3 font-medium text-danger transition hover:bg-red-50">
              Load More Products
            </button>
          </div>
        )}

        <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="rounded-xl border border-zinc-200 bg-white p-6">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
                <Truck className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="font-bold text-zinc-800">Fast Delivery</h3>
            </div>
            <p className="text-zinc-600">Get your products delivered within 24-48 hours in major cities.</p>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-white p-6">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100">
                <Tag className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="font-bold text-zinc-800">Best Prices</h3>
            </div>
            <p className="text-zinc-600">Competitive prices with regular discounts and special offers.</p>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-white p-6">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-violet-100">
                <Shield className="h-6 w-6 text-violet-600" />
              </div>
              <h3 className="font-bold text-zinc-800">Secure Shopping</h3>
            </div>
            <p className="text-zinc-600">Secure payment and buyer protection on all purchases.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
