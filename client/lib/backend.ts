const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "https://gateguard-backend-zzto.onrender.com").replace(/\/+$/, "");

export function normalizeImageUrl(value?: string | null): string | undefined {
  if (!value || typeof value !== "string") return undefined;
  const trimmed = value.trim();
  if (!trimmed || trimmed === "null" || trimmed === "undefined") return undefined;

  // Data URLs or Blob URLs
  if (trimmed.startsWith("data:") || trimmed.startsWith("blob:")) {
    return trimmed;
  }

  // Cloudinary CDN URLs (force HTTPS to prevent mixed content blocking)
  if (trimmed.includes("cloudinary.com") || trimmed.includes("res.cloudinary.com")) {
    if (trimmed.startsWith("http://")) {
      return trimmed.replace(/^http:\/\//i, "https://");
    }
    return trimmed;
  }

  // URLs containing /media/
  const mediaIdx = trimmed.indexOf("/media/");
  if (mediaIdx !== -1) {
    const mediaPath = trimmed.substring(mediaIdx);
    return `${API_BASE_URL}${mediaPath}`;
  }

  // Any other absolute URL (like qrserver)
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  // Relative path (e.g. "users/profile_images/photo.jpg" or "/users/...")
  const normalizedPath = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  if (!normalizedPath.startsWith("/media/")) {
    return `${API_BASE_URL}/media${normalizedPath}`;
  }
  return `${API_BASE_URL}${normalizedPath}`;
}

function extractErrorMessage(payload: any, fallback: string) {
  if (!payload) return fallback;

  if (typeof payload === "string" && payload.trim()) {
    return payload;
  }

  if (typeof payload === "object") {
    if (typeof payload.detail === "string" && payload.detail.trim()) {
      return payload.detail;
    }

    if (typeof payload.message === "string" && payload.message.trim()) {
      return payload.message;
    }

    for (const value of Object.values(payload)) {
      if (Array.isArray(value) && value.length > 0 && typeof value[0] === "string") {
        return value[0];
      }
      if (typeof value === "string" && value.trim()) {
        return value;
      }
    }
  }

  return fallback;
}

function getStoredToken() {
  return sessionStorage.getItem("gateguard_access_token");
}

function buildHeaders(includeAuth = true, extra: Record<string, string> = {}) {
  const headers: Record<string, string> = { ...extra };
  if (includeAuth) {
    const token = getStoredToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const isFormData = init.body instanceof FormData;
  const headers: Record<string, string> = {
    ...buildHeaders(true),
    ...((init.headers as Record<string, string>) || {}),
  };

  if (!isFormData && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }
  if (isFormData) {
    delete headers["Content-Type"];
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
  });

  const text = await response.text();
  let payload: any = null;
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = text;
    }
  }

  if (!response.ok) {
    throw new Error(extractErrorMessage(payload, "Request failed"));
  }

  return payload as T;
}

export async function login(username: string, password: string) {
  const payload = await fetch(`${API_BASE_URL}/api/auth/login/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  }).then(async (response) => {
    const text = await response.text();
    let data: any = null;
    if (text) {
      try {
        data = JSON.parse(text);
      } catch {
        data = text;
      }
    }
    if (!response.ok) {
      throw new Error(extractErrorMessage(data, "Login failed"));
    }
    return data;
  });

  if (payload.access) {
    sessionStorage.setItem("gateguard_access_token", payload.access);
    sessionStorage.setItem("gateguard_refresh_token", payload.refresh || "");
  }

  return payload;
}

export async function getMeProfile() {
  return request<any>("/api/auth/me/");
}

export async function listUsers() {
  return request<any>("/api/auth/users/");
}

export async function createUser(data: Record<string, unknown> | FormData) {
  return request<any>("/api/auth/users/create/", {
    method: "POST",
    body: data instanceof FormData ? data : JSON.stringify(data),
  });
}

export async function createGuard(data: Record<string, unknown> | FormData) {
  return request<any>("/api/auth/guards/create/", {
    method: "POST",
    body: data instanceof FormData ? data : JSON.stringify(data),
  });
}

export async function listDepartments() {
  return request<any>("/api/dpts/");
}

export async function registerDepartment(data: Record<string, unknown>) {
  return request<any>("/api/dpts/register/", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function listDevices() {
  return request<any>("/api/devices/");
}

export async function listMyDevices() {
  return request<any>("/api/devices/my-devices/");
}

export async function createDevice(data: Record<string, unknown>) {
  return request<any>("/api/devices/", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateDevice(deviceId: string, data: Record<string, unknown>) {
  return request<any>(`/api/devices/${deviceId}/`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function reportLostDevice(deviceId: string) {
  return request<any>(`/api/devices/report-lost/${deviceId}/`, {
    method: "PATCH",
    body: JSON.stringify({}),
  });
}

export async function setupPassword(token: string, newPassword: string) {
  return request<any>("/api/auth/setup-password/", {
    method: "POST",
    body: JSON.stringify({ token, new_password: newPassword }),
  });
}

export async function changePassword(currentPassword?: string, newPassword?: string) {
  return request<any>("/api/auth/change-password/", {
    method: "POST",
    body: JSON.stringify({
      current_password: currentPassword,
      new_password: newPassword,
    }),
  });
}

export async function resetForgotPassword(identifier: string, email?: string, newPassword?: string) {
  return request<any>("/api/auth/forgot-password/", {
    method: "POST",
    body: JSON.stringify({
      identifier,
      email,
      new_password: newPassword,
    }),
  });
}

export async function guestCheckIn(data: {
  guest_name?: string;
  guest_id_doc: string;
  serial_number?: string;
}) {
  return request<any>("/api/guests/check-in/", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function guestCheckOut(data: {
  pass_id: string;
  guest_id_doc?: string;
  serial_number?: string;
  notes?: string;
}) {
  return request<any>("/api/guests/check-out/", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function listGuestPasses() {
  return request<any>("/api/guests/");
}

export async function deleteUser(userId: string) {
  return request<any>(`/api/auth/users/${userId}/`, {
    method: "DELETE",
  });
}

export async function resendSetupEmail(userId: string) {
  return request<any>("/api/auth/resend-setup-email/", {
    method: "POST",
    body: JSON.stringify({ user_id: userId }),
  });
}

export function logout() {
  sessionStorage.removeItem("gateguard_access_token");
  sessionStorage.removeItem("gateguard_refresh_token");
}
