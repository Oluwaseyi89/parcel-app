import { env } from "@/env";

type JsonBody = Record<string, unknown> | Array<unknown>;

export type ApiRequestOptions = Omit<RequestInit, "body"> & {
  body?: BodyInit | JsonBody;
  json?: boolean;
};

export type ApiEnvelope<T> = {
  status?: string;
  message?: string;
  data?: T;
  errors?: unknown;
};

type CsrfResponse = {
  data?: {
    csrf_token?: string;
  };
};

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS", "TRACE"]);

let csrfTokenCache: string | null = null;
let csrfTokenPromise: Promise<string | null> | null = null;

function toAbsoluteUrl(path: string): string {
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }

  return `${env.apiBase}${path.startsWith("/") ? path : `/${path}`}`;
}

async function ensureCsrfToken(): Promise<string | null> {
  if (csrfTokenCache) {
    return csrfTokenCache;
  }

  if (!csrfTokenPromise) {
    csrfTokenPromise = (async () => {
      const response = await fetch(toAbsoluteUrl("/auth/csrf/"), {
        method: "GET",
        credentials: "include",
        mode: "cors",
        cache: "no-store",
        headers: {
          "X-Requested-With": "XMLHttpRequest",
        },
      });

      if (!response.ok) {
        return null;
      }

      const body = (await response.json()) as CsrfResponse;
      const token = body?.data?.csrf_token ?? null;
      csrfTokenCache = token;
      return token;
    })()
      .catch(() => null)
      .finally(() => {
        csrfTokenPromise = null;
      });
  }

  return csrfTokenPromise;
}

function extractApiErrorMessage(body: unknown): string | null {
  if (!body) return null;
  if (typeof body === "string") {
    return body.trim() || null;
  }
  if (typeof body !== "object") {
    return null;
  }

  const payload = body as {
    message?: unknown;
    detail?: unknown;
    error?: unknown;
    data?: unknown;
    errors?: unknown;
  };

  const direct = [payload.message, payload.detail, payload.error, payload.data]
    .find((value) => typeof value === "string" && String(value).trim().length > 0);
  if (typeof direct === "string") {
    return direct.trim();
  }

  const errors = payload.errors;
  if (errors && typeof errors === "object" && !Array.isArray(errors)) {
    const firstValue = Object.values(errors as Record<string, unknown>)[0];
    if (Array.isArray(firstValue) && firstValue.length > 0) {
      const firstItem = firstValue[0];
      if (typeof firstItem === "string" && firstItem.trim()) return firstItem.trim();
    }
    if (typeof firstValue === "string" && firstValue.trim()) {
      return firstValue.trim();
    }
  }

  return null;
}

export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const { headers, body, json = true, ...rest } = options;
  const method = (rest.method ?? "GET").toUpperCase();

  const resolvedHeaders = new Headers(headers || {});
  resolvedHeaders.set("X-Requested-With", "XMLHttpRequest");

  if (!SAFE_METHODS.has(method) && !resolvedHeaders.has("X-CSRFToken")) {
    const csrfToken = await ensureCsrfToken();
    if (csrfToken) {
      resolvedHeaders.set("X-CSRFToken", csrfToken);
    }
  }

  const requestInit: RequestInit = {
    ...rest,
    headers: resolvedHeaders,
    credentials: rest.credentials ?? "include",
    mode: rest.mode ?? "cors",
  };

  if (json && body && !(body instanceof FormData)) {
    resolvedHeaders.set("Content-Type", "application/json");
    resolvedHeaders.set("Accept", "application/json");
    requestInit.body = JSON.stringify(body);
  } else {
    requestInit.body = body as BodyInit | undefined;
  }

  const res = await fetch(toAbsoluteUrl(path), requestInit);

  if (!res.ok) {
    const raw = await res.text().catch(() => "");
    let message = `Request failed (${res.status})`;
    try {
      const body = JSON.parse(raw) as unknown;
      const extracted = extractApiErrorMessage(body);
      if (extracted) message = extracted;
    } catch {
      if (raw.trim()) message = raw.trim();
    }
    throw new Error(message);
  }

  if (res.status === 204) {
    return undefined as T;
  }

  return (await res.json()) as T;
}

export function unwrapApiData<T>(payload: T | ApiEnvelope<T> | null | undefined, fallback: T): T {
  if (payload == null) {
    return fallback;
  }

  if (typeof payload === "object" && !Array.isArray(payload) && "data" in payload) {
    const data = (payload as ApiEnvelope<T>).data;
    return (data ?? fallback) as T;
  }

  return payload as T;
}

/**
 * Unwraps a list from any DRF response shape:
 *   { data: T[] }
 *   { results: { data: T[] } }
 *   { results: T[] }
 *   T[]  (raw array)
 * Returns an empty array on anything else.
 */
export function unwrapListData<T>(payload: unknown): T[] {
  if (Array.isArray(payload)) return payload as T[];
  if (!payload || typeof payload !== "object") return [];

  const body = payload as Record<string, unknown>;
  if (Array.isArray(body.data)) return body.data as T[];

  if (body.results && typeof body.results === "object") {
    const results = body.results as Record<string, unknown>;
    if (Array.isArray(results.data)) return results.data as T[];
    if (Array.isArray(body.results)) return body.results as T[];
  }

  return [];
}

export async function apiJSON<T>(path: string, method: string, body?: JsonBody): Promise<T> {
  return apiRequest<T>(path, { method, body, json: true });
}

export async function apiForm<T>(path: string, method: string, formData?: FormData): Promise<T> {
  return apiRequest<T>(path, { method, body: formData, json: false });
}
