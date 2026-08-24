const TOKEN_KEY = "tm_admin_token";

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

export const getToken = () => localStorage.getItem(TOKEN_KEY) || "";
export const setToken = (t) =>
  t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY);

export async function api(path, { method = "GET", body, form } = {}) {
  const headers = {};
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body) headers["Content-Type"] = "application/json";

  const res = await fetch(`/api${path}`, {
    method,
    headers,
    body: form ? form : body ? JSON.stringify(body) : undefined
  });

  let data = {};
  try {
    data = await res.json();
  } catch {
    /* non-json response */
  }

  if (!res.ok) {
    if (res.status === 401 && token && path.startsWith("/admin")) {
      window.dispatchEvent(new Event("tm:unauthorized"));
    }
    throw new ApiError(data.error || res.statusText || "Request failed", res.status);
  }
  return data;
}
