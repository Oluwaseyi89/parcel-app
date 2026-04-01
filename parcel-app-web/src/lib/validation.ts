/**
 * Form validation utilities for Stage 8 hardening
 * Provides email, password, phone, and general field validation
 */

export interface ValidationError {
  field: string;
  message: string;
}

/**
 * Validates email format
 */
export function validateEmail(email: string): ValidationError | null {
  if (!email || !email.trim()) {
    return { field: "email", message: "Email is required." };
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { field: "email", message: "Please enter a valid email address." };
  }
  return null;
}

/**
 * Validates password strength (min 8 chars, mixed case and number)
 */
export function validatePassword(password: string, minLength = 8): ValidationError | null {
  if (!password || !password.trim()) {
    return { field: "password", message: "Password is required." };
  }
  if (password.length < minLength) {
    return { field: "password", message: `Password must be at least ${minLength} characters.` };
  }
  if (!/[a-z]/.test(password) || !/[A-Z]/.test(password)) {
    return { field: "password", message: "Password must contain both uppercase and lowercase letters." };
  }
  if (!/\d/.test(password)) {
    return { field: "password", message: "Password must contain at least one number." };
  }
  return null;
}

/**
 * Validates password confirmation
 */
export function validatePasswordMatch(password: string, confirmPassword: string): ValidationError | null {
  if (!confirmPassword) {
    return { field: "confirmPassword", message: "Please confirm your password." };
  }
  if (password !== confirmPassword) {
    return { field: "confirmPassword", message: "Passwords do not match." };
  }
  return null;
}

/**
 * Validates phone number (basic format: 10-15 digits, optional +)
 */
export function validatePhone(phone: string): ValidationError | null {
  if (!phone || !phone.trim()) {
    return { field: "phone_no", message: "Phone number is required." };
  }
  const phoneRegex = /^\+?[1-9]\d{1,14}$/;
  if (!phoneRegex.test(phone.replace(/\s/g, ""))) {
    return { field: "phone_no", message: "Please enter a valid phone number." };
  }
  return null;
}

/**
 * Validates required text field
 */
export function validateRequired(value: string, fieldName: string): ValidationError | null {
  if (!value || !value.trim()) {
    return { field: fieldName, message: `${fieldName} is required.` };
  }
  return null;
}

/**
 * Validates zip/postal code
 */
export function validateZipCode(zipCode: string): ValidationError | null {
  if (!zipCode || !zipCode.trim()) {
    return { field: "zip_code", message: "Zip code is required." };
  }
  if (zipCode.length < 3) {
    return { field: "zip_code", message: "Zip code must be at least 3 characters." };
  }
  return null;
}

/**
 * Validates shipping form completeness
 */
export function validateShippingForm(data: {
  first_name?: string;
  last_name?: string;
  street?: string;
  state?: string;
  country?: string;
  email?: string;
  phone_no?: string;
  zip_code?: string;
  shipping_method?: string;
}): ValidationError | null {
  const required = ["first_name", "last_name", "street", "state", "country", "email", "phone_no", "zip_code", "shipping_method"];
  for (const field of required) {
    const value = data[field as keyof typeof data] as string;
    if (!value || !value.trim()) {
      return { field, message: `${field.replace(/_/g, " ")} is required.` };
    }
  }

  const emailError = validateEmail(data.email ?? "");
  if (emailError) return emailError;

  const phoneError = validatePhone(data.phone_no ?? "");
  if (phoneError) return phoneError;

  const zipError = validateZipCode(data.zip_code ?? "");
  if (zipError) return zipError;

  return null;
}

/**
 * Normalizes API error messages
 */
export function normalizeApiError(error: unknown): string {
  if (error instanceof Error) {
    // Network errors
    if (error.message.includes("Failed to fetch")) {
      return "Unable to connect to server. Please check your internet connection and try again.";
    }
    if (error.message.includes("timeout")) {
      return "Request timed out. The server is not responding. Please try again.";
    }
    return error.message;
  }

  if (typeof error === "string") return error;

  return "An unexpected error occurred. Please try again.";
}

/**
 * Extracts error message from API response
 */
export function getApiErrorMessage(response: { data?: unknown; message?: string; error?: string }): string {
  if (response.message) return response.message;
  if (response.error) return response.error;
  if (typeof response.data === "string") return response.data;

  return "An error occurred. Please try again.";
}

/**
 * Validates that user provided required fields in checkout
 */
export function validateCheckoutDraft(draft: { items?: unknown[]; customer?: unknown }): string | null {
  if (!draft.items || !Array.isArray(draft.items) || draft.items.length === 0) {
    return "Your cart is empty. Please add items before checkout.";
  }

  if (!draft.customer) {
    return "Shipping information is missing. Please fill out your details.";
  }

  return null;
}
