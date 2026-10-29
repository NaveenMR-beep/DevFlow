const configuredApiUrl = import.meta.env.VITE_API_URL;

export const API_BASE_URL = (
  configuredApiUrl || "https://devflow-backend-7emx.onrender.com"
).replace(/\/+$/, "");

export async function getApiErrorMessage(
  response: Response,
  fallback: string
): Promise<string> {
  let detail = "";

  try {
    const body: unknown = await response.json();

    if (typeof body === "object" && body !== null && "detail" in body) {
      const responseDetail = body.detail;
      if (typeof responseDetail === "string") {
        detail = responseDetail;
      } else if (Array.isArray(responseDetail)) {
        detail = responseDetail
          .map((item: unknown) => {
            if (typeof item !== "object" || item === null || !("msg" in item)) {
              return "";
            }

            const message = typeof item.msg === "string" ? item.msg : "";
            const location =
              "loc" in item && Array.isArray(item.loc)
                ? item.loc.filter(
                    (part: unknown): part is string | number =>
                      typeof part === "string" || typeof part === "number"
                  )
                : [];
            const field = location.slice(1).join(".");
            return field ? `${field}: ${message}` : message;
          })
          .filter(Boolean)
          .join("; ");
      }
    }
  } catch {
    // Error responses may be empty or non-JSON; status still identifies the failure.
  }

  switch (response.status) {
    case 401:
      return detail || "Authentication failed (401). Please log in again.";
    case 403:
      return detail || "You do not have permission to perform this action (403).";
    case 404:
      return detail || "The requested API resource was not found (404).";
    case 422:
      return detail || "The submitted data is invalid (422). Check the form and try again.";
    case 500:
      return "The backend encountered an internal error (500). Please try again later.";
    case 502:
    case 503:
    case 504:
      return "The backend is temporarily unavailable. Render may be starting the service; please try again shortly.";
    default:
      return detail || `${fallback} (HTTP ${response.status}).`;
  }
}

export function getApiRequestErrorMessage(
  error: unknown,
  fallback: string
): string {
  if (error instanceof TypeError) {
    return "Could not reach the API. Check your network, the backend URL, and CORS configuration. The Render service may also need a moment to wake up.";
  }

  return error instanceof Error ? error.message : fallback;
}
