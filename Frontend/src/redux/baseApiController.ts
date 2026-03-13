/**
 * Base API Controller – central config for API base URL and env-based overrides.
 */
const BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000/api";

export const baseApiController = {
  baseUrl: BASE_URL,
} as const;
