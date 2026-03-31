const DEFAULT_API_BASE = "http://localhost:7000";

export const env = {
  apiBase: process.env.NEXT_PUBLIC_API_BASE?.trim() || DEFAULT_API_BASE,
};

export function validateEnv(): void {
  if (!env.apiBase) {
    throw new Error("Missing NEXT_PUBLIC_API_BASE.");
  }
}

validateEnv();
