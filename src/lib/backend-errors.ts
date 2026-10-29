/** PostgREST reports a missing RPC separately from connectivity and permission errors. */
export function isMissingBackendFunction(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  return "code" in error && error.code === "PGRST202";
}
