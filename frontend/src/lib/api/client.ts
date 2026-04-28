type ApiRequestOptions = {
  signal?: AbortSignal;
};

type ApiErrorPayload = {
  code?: string;
  details?: string[];
  message?: string;
};

export class ApiError extends Error {
  status: number;
  code?: string;
  details?: string[];

  constructor(status: number, payload?: ApiErrorPayload) {
    super(payload?.message ?? `API request failed with status ${status}`);
    this.name = "ApiError";
    this.status = status;
    this.code = payload?.code;
    this.details = payload?.details;
  }
}

function getApiBaseUrl() {
  if (import.meta.env.DEV) {
    return "/api";
  }

  const baseUrl = import.meta.env.VITE_API_BASE_URL?.trim();

  if (!baseUrl) {
    throw new Error("VITE_API_BASE_URL is not configured");
  }

  return baseUrl.replace(/\/+$/, "");
}

export async function apiGet(path: string, options: ApiRequestOptions = {}) {
  return request(path, {
    ...options,
    method: "GET",
  });
}

export async function apiPost(path: string, body: unknown, options: ApiRequestOptions = {}) {
  return request(path, {
    ...options,
    body,
    method: "POST",
  });
}

type ApiRequestConfig = ApiRequestOptions & {
  body?: unknown;
  method: "GET" | "POST";
};

async function request(path: string, config: ApiRequestConfig) {
  const headers: HeadersInit = {
    Accept: "application/json",
  };

  let body: string | undefined;
  if (config.body !== undefined) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(config.body);
  }

  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    method: config.method,
    headers,
    body,
    signal: config.signal,
  });

  const payload = await parseResponsePayload(response);

  if (!response.ok) {
    if (hasApiErrorPayload(payload)) {
      throw new ApiError(response.status, payload);
    }

    throw new ApiError(response.status);
  }

  return payload;
}

async function parseResponsePayload(response: Response) {
  const text = await response.text();

  if (text === "") {
    return null;
  }

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

function hasApiErrorPayload(value: unknown): value is ApiErrorPayload {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const candidate = value as { code?: unknown; details?: unknown; message?: unknown };

  return (
    typeof candidate.message === "string" &&
    (candidate.code === undefined || typeof candidate.code === "string") &&
    (candidate.details === undefined ||
      (Array.isArray(candidate.details) && candidate.details.every((item) => typeof item === "string")))
  );
}
