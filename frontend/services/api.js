export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

if (!API_BASE_URL) {
  throw new Error("❌ NEXT_PUBLIC_API_BASE_URL is not set");
}

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
      credentials: "include",   // ✅ already correct
      ...options,
    });
  } catch (err) {
    throw new Error("Cannot connect to server");
  }

  const contentType = res.headers.get("content-type") || "";
  const body = contentType.includes("application/json")
    ? await res.json()
    : await res.text();

  if (!res.ok) {
    // 🔥 FIX: allow refresh for ALL requests except login/signup
    if (
      res.status === 401 &&
      !_retried &&
      !isRefreshing &&
      !path.includes("/auth/login") &&
      !path.includes("/auth/signup")
    ) {
      isRefreshing = true;

      try {
        const refreshRes = await fetch(`${API_BASE_URL}/auth/refresh`, {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            "X-Requested-With": "XMLHttpRequest",
          },
        });

        isRefreshing = false;

        if (refreshRes.ok) {
          return request(path, options, true);
        }
      } catch {
        isRefreshing = false;
      }

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

// ─── API FUNCTIONS ─────────────────

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