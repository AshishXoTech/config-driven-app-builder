export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

function safeMessage(body) {
  if (typeof body === "string") return body || "Request failed";
  if (body && typeof body === "object") {
    let msg = body.message || body.error || "Request failed";
    if (body.field && typeof body.field === "string") {
      msg = `${body.field}: ${msg}`;
    }
    return msg;
  }
  return "Request failed";
}

/**
 * Core request wrapper.
 *
 * Handles:
 * - Auto-attaching CSRF + auth headers
 * - 401 interception with automatic token refresh (one retry)
 * - Network failure → clean user-facing error
 */
let isRefreshing = false;

async function request(path, options = {}, _retried = false) {
  const isFormData = options.body instanceof FormData;
  const headers = {
    ...(isFormData ? {} : { "Content-Type": "application/json" }),
    "X-Requested-With": "XMLHttpRequest",
    ...(options.headers || {}),
  };

  let res;
  try {
    res = await fetch(`${API_BASE_URL}${path}`, {
      headers,
      credentials: "include",
      ...options,
    });
  } catch (err) {
    const offlineError = new Error("Cannot connect to server. Please check your connection.");
    offlineError.name = "NetworkError";
    throw offlineError;
  }

  const contentType = res.headers.get("content-type") || "";
  const body = contentType.includes("application/json") ? await res.json() : await res.text();

  if (!res.ok) {
    // On 401, try to silently refresh the access token ONCE
    if (res.status === 401 && !_retried && !isRefreshing && !path.startsWith("/auth/")) {
      isRefreshing = true;
      try {
        const refreshRes = await fetch(`${API_BASE_URL}/auth/refresh`, {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            "X-Requested-With": "XMLHttpRequest"
          },
        });
        isRefreshing = false;
        if (refreshRes.ok) {
          // Retry the original request with the new access token
          return request(path, options, true);
        }
      } catch {
        isRefreshing = false;
      }

      // Refresh failed — session is dead
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("auth:expired"));
      }
    }

    const msg = safeMessage(body);
    const err = new Error(msg);
    err.name = `HTTP_${res.status}`;
    err.status = res.status;
    throw err;
  }
  return body;
}

// ─── API Functions ──────────────────────────────────────────────────

export function fetchConfig() {
  return request("/config");
}

export function create(model, data) {
  return request(`/api/${model}`, { method: "POST", body: JSON.stringify(data) });
}

export function getAll(model, page = 1, limit = 50) {
  return request(`/api/${model}?page=${page}&limit=${limit}`);
}

export function update(model, id, data) {
  return request(`/api/${model}/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function delete_(model, id) {
  return request(`/api/${model}/${encodeURIComponent(id)}`, { method: "DELETE" });
}

export function importCSV(model, formData) {
  return request(`/api/${model}/import`, {
    method: "POST",
    body: formData,
  });
}

export function getJobStatus(jobId) {
  return request(`/api/jobs/${encodeURIComponent(jobId)}`);
}

export function login(email, password) {
  return request("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function signup(email, password) {
  return request("/auth/signup", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function sendOtp(email) {
  return request("/auth/otp/send", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export function verifyOtp(email, code) {
  return request("/auth/otp/verify", {
    method: "POST",
    body: JSON.stringify({ email, code }),
  });
}

export function getMe() {
  return request("/api/me");
}
