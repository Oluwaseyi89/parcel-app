import type { Product } from "@/lib/types";

export function formatNaira(amount: number): string {
  return `₦ ${Number(amount || 0).toLocaleString()}`;
}

export function getProductPrice(product: Product): number {
  return Number(product.prod_price ?? product.price ?? 0);
}

export function getProductDiscount(product: Product): number {
  return Number(product.prod_disc ?? product.discount ?? 0);
}

export function getDiscountedPrice(product: Product): number {
  const price = getProductPrice(product);
  const discount = getProductDiscount(product);
  return price - price * (discount / 100);
}

export function getProductName(product: Product): string {
  return String(product.prod_name ?? product.name ?? product.title ?? "Unnamed Product");
}

export function getProductDescription(product: Product): string {
  return String(product.prod_desc ?? product.description ?? "No description available.");
}

export function getProductModel(product: Product): string {
  return String(product.prod_model ?? "Standard Model");
}

export function getProductPhoto(product: Product): string {
  return String(product.prod_photo ?? product.photo ?? "");
}

export function getProductRating(product: Product): number {
  return Number(product.rating ?? 4.5);
}

export function getProductStock(product: Product): number {
  return Number(product.stock ?? 0);
}
