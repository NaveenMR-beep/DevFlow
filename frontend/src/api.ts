const configuredApiUrl = import.meta.env.VITE_API_URL;

export const API_URL = (
  configuredApiUrl || "https://devflow-backend-7emx.onrender.com"
).replace(/\/+$/, "");
