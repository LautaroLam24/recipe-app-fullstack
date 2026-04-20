const DEFAULT_API = "http://localhost:3001";

export function getApiBaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_API_URL ?? DEFAULT_API;
  return url.replace(/\/$/, "");
}

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly body: unknown,
  ) {
    super(formatApiMessage(body));
    this.name = "ApiError";
  }
}

function formatApiMessage(body: unknown): string {
  if (!body || typeof body !== "object") {
    return "No se pudo completar la solicitud.";
  }
  const record = body as Record<string, unknown>;
  const msg = record.message;
  if (typeof msg === "string") {
    return msg;
  }
  if (Array.isArray(msg)) {
    return msg.map(String).join(" ");
  }
  if (msg && typeof msg === "object") {
    return Object.values(msg as Record<string, unknown>)
      .flatMap((v) => (Array.isArray(v) ? v : [v]))
      .map(String)
      .filter(Boolean)
      .join(" ");
  }
  return "No se pudo completar la solicitud.";
}

export function resolveImageUrl(imageUrl: string | null): string | null {
  if (!imageUrl) return null;
  if (imageUrl.startsWith("http")) return imageUrl;
  return `${getApiBaseUrl()}${imageUrl}`;
}

async function parseResponse<T>(res: Response): Promise<T> {
  const text = await res.text();
  let data: unknown = null;
  if (text) {
    try {
      data = JSON.parse(text) as unknown;
    } catch {
      data = { message: text };
    }
  }
  if (!res.ok) {
    throw new ApiError(res.status, data);
  }
  return data as T;
}

export async function apiUpload<T>(path: string, formData: FormData): Promise<T> {
  const url = `${getApiBaseUrl()}${path.startsWith("/") ? path : `/${path}`}`;
  const res = await fetch(url, {
    method: "PATCH",
    credentials: "include",
    body: formData,
  });
  return parseResponse<T>(res);
}

export async function apiJson<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const url = `${getApiBaseUrl()}${path.startsWith("/") ? path : `/${path}`}`;
  const res = await fetch(url, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });
  return parseResponse<T>(res);
}
