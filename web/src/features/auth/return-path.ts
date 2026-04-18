/** Evita open redirects: solo paths relativos internos. */
export function resolveReturnPath(from: string | null): string {
  if (!from) {
    return "/recipes";
  }
  const decoded = (() => {
    try {
      return decodeURIComponent(from);
    } catch {
      return from;
    }
  })();
  if (
    decoded.startsWith("/") &&
    !decoded.startsWith("//") &&
    !decoded.includes("://")
  ) {
    return decoded;
  }
  return "/recipes";
}
