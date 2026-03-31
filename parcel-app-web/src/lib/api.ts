import { env } from "@/env";

type JsonBody = Record<string, unknown> | Array<unknown>;

type ApiRequestOptions = Omit<RequestInit, "body"> & {
  body?: BodyInit | JsonBody;
  json?: boolean;
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
    const payload = await res.text().catch(() => "");
    throw new Error(`API request failed (${res.status}): ${payload}`);
  }

  if (res.status === 204) {
    return undefined as T;
  }

  return (await res.json()) as T;
}

export async function apiJSON<T>(path: string, method: string, body?: JsonBody): Promise<T> {
  return apiRequest<T>(path, { method, body, json: true });
}

export async function apiForm<T>(path: string, method: string, formData?: FormData): Promise<T> {
  return apiRequest<T>(path, { method, body: formData, json: false });
}
