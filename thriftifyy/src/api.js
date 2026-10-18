import axios from "axios";

const api = axios.create({
  baseURL: "/api",
});

// Keeps fetch-based pages on the same proxied API path as Axios pages.
export async function apiFetch(url, options = {}) {
  const response = await api.request({
    url,
    method: options.method || "GET",
    data: options.body,
    headers: options.headers,
    validateStatus: () => true,
  });

  return {
    ok: response.status >= 200 && response.status < 300,
    status: response.status,
    json: async () => response.data,
  };
}

export default api;
