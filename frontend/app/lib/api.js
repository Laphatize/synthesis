const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "";

export async function apiFetch(path, options = {}, token) {
  const url = `${API_BASE}${path}`;
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(url, {
    ...options,
    headers,
    credentials: "include",
  });

  const contentType = res.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");
  const payload = isJson ? await res.json() : await res.text();

  if (!res.ok) {
    const message = payload?.error || payload || "Request failed";
    throw new Error(message);
  }

  return payload;
}
