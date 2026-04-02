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

function getCookie(name: string): string | null {
  if (typeof document === "undefined" || !document.cookie) {
    return null;
  }

  const cookies = document.cookie.split(";");
  for (const entry of cookies) {
    const cookie = entry.trim();
    if (cookie.startsWith(`${name}=`)) {
      return decodeURIComponent(cookie.slice(name.length + 1));
    }
  }

  return null;
}

function toAbsoluteUrl(path: string): string {
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }

  return `${env.apiBase}${path.startsWith("/") ? path : `/${path}`}`;
}

export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const { headers, body, json = true, ...rest } = options;
  const csrftoken = getCookie("csrftoken");

  const resolvedHeaders = new Headers(headers || {});
  resolvedHeaders.set("X-Requested-With", "XMLHttpRequest");
  if (csrftoken) {
    resolvedHeaders.set("X-CSRFToken", csrftoken);
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
      const body = JSON.parse(raw) as { message?: string; detail?: string; error?: string };
      const extracted = body.message ?? body.detail ?? body.error;
      if (extracted) message = String(extracted);
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

export async function apiJSON<T>(path: string, method: string, body?: JsonBody): Promise<T> {
  return apiRequest<T>(path, { method, body, json: true });
}

export async function apiForm<T>(path: string, method: string, formData?: FormData): Promise<T> {
  return apiRequest<T>(path, { method, body: formData, json: false });
}
