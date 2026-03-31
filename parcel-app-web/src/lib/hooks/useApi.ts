"use client";

import { useCallback, useState } from "react";

import { apiRequest, type ApiRequestOptions } from "@/lib/api";

type Status = "idle" | "loading" | "success" | "error";

export function useApi() {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  const request = useCallback(async <T>(path: string, options?: ApiRequestOptions): Promise<T> => {
    setStatus("loading");
    setError(null);

    try {
      const response = await apiRequest<T>(path, options);
      setStatus("success");
      return response;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unexpected API error.";
      setStatus("error");
      setError(message);
      throw err;
    }
  }, []);

  return {
    request,
    status,
    isLoading: status === "loading",
    isError: status === "error",
    isSuccess: status === "success",
    error,
  };
}
