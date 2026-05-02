// Inject auth token into all API requests
const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

export function getApiBase() {
  return BASE;
}

// This is used by the custom-fetch in api-client-react
// The token is read from localStorage by the custom-fetch setup
