// API configuration for Flask Backend integration.

const getBackendUrl = () => {
  return localStorage.getItem("elderly-ai-backend-url") || "http://localhost:5000";
};

const apiRequest = async (endpoint, options = {}) => {
  const baseUrl = getBackendUrl();
  const url = `${baseUrl}${endpoint}`;

  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  const config = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(url, config);
    const json = await response.json();

    if (!response.ok) {
      throw new Error(json.message || `API request failed with status ${response.status}`);
    }

    return json;
  } catch (error) {
    console.error(`API Error on ${endpoint}:`, error);
    throw error;
  }
};

const api = {
  get: (endpoint) => apiRequest(endpoint, { method: "GET" }),
  post: (endpoint, data) => apiRequest(endpoint, { method: "POST", body: JSON.stringify(data) }),
  put: (endpoint, data) => apiRequest(endpoint, { method: "PUT", body: JSON.stringify(data) }),
  patch: (endpoint, data) => apiRequest(endpoint, { method: "PATCH", body: JSON.stringify(data) }),
  delete: (endpoint) => apiRequest(endpoint, { method: "DELETE" }),
};

export default api;
