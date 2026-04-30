export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

if (!API_BASE_URL) {
  throw new Error("❌ NEXT_PUBLIC_API_BASE_URL is not set");
}

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

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

let isRefreshing = false;

// ─────────────────────────────────────────────
// CORE REQUEST FUNCTION (TOKEN-BASED)
// ─────────────────────────────────────────────

async function request(path, options = {}, _retried = false) {
  const isFormData = options.body instanceof FormData;

  const token = localStorage.getItem("accessToken");

  const headers = {
    ...(isFormData ? {} : { "Content-Type": "application/json" }),
    "X-Requested-With": "XMLHttpRequest",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  let res;

  try {
    res = await fetch(`${API_BASE_URL}${path}`, {
      headers,
      ...options,
    });
  } catch {
    throw new Error("Cannot connect to server");
  }

  const contentType = res.headers.get("content-type") || "";
  const body = contentType.includes("application/json")
    ? await res.json()
    : await res.text();

  // ─────────────────────────────────────────────
  // AUTO REFRESH TOKEN LOGIC
  // ─────────────────────────────────────────────

  if (!res.ok) {
    if (
      res.status === 401 &&
      !_retried &&
      !isRefreshing &&
      !path.includes("/auth/login") &&
      !path.includes("/auth/signup")
    ) {
      isRefreshing = true;

      try {
        const refreshToken = localStorage.getItem("refreshToken");

        const refreshRes = await fetch(`${API_BASE_URL}/auth/refresh`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Requested-With": "XMLHttpRequest",
          },
          body: JSON.stringify({ refreshToken }),
        });

        const data = await refreshRes.json();

        isRefreshing = false;

        if (refreshRes.ok) {
          // ✅ SAVE NEW TOKENS
          localStorage.setItem("accessToken", data.accessToken);
          localStorage.setItem("refreshToken", data.refreshToken);

          // 🔁 RETRY ORIGINAL REQUEST
          return request(path, options, true);
        }
      } catch {
        isRefreshing = false;
      }

      // ❌ SESSION DEAD
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");

      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("auth:expired"));
      }
    }

    const err = new Error(safeMessage(body));
    err.status = res.status;
    throw err;
  }

  return body;
}

// ─────────────────────────────────────────────
// AUTH FUNCTIONS
// ─────────────────────────────────────────────

export async function login(email, password) {
  const res = await request("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });

  // ✅ STORE TOKENS
  localStorage.setItem("accessToken", res.accessToken);
  localStorage.setItem("refreshToken", res.refreshToken);

  return res;
}

export async function signup(email, password) {
  const res = await request("/auth/signup", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });

  // ✅ STORE TOKENS
  localStorage.setItem("accessToken", res.accessToken);
  localStorage.setItem("refreshToken", res.refreshToken);

  return res;
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

export function logout() {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
}

// ─────────────────────────────────────────────
// API FUNCTIONS
// ─────────────────────────────────────────────

export function getMe() {
  return request("/api/me");
}

export function fetchConfig() {
  return request("/config");
}

export function create(model, data) {
  return request(`/api/${model}`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function getAll(model, page = 1, limit = 50) {
  return request(`/api/${model}?page=${page}&limit=${limit}`);
}

export function update(model, id, data) {
  return request(`/api/${model}/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function delete_(model, id) {
  return request(`/api/${model}/${id}`, {
    method: "DELETE",
  });
}

export function importCSV(model, formData) {
  return request(`/api/${model}/import`, {
    method: "POST",
    body: formData,
  });
}

export function getJobStatus(jobId) {
  return request(`/api/jobs/${jobId}`);
}
