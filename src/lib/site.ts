// NEXT_PUBLIC_SITE_URL must be a full URL (https://yourdomain.com). Invalid or
// empty values fall back to the default so builds never crash on new URL().
export function getSiteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (raw) {
    try {
      new URL(raw);
      return raw;
    } catch {
      // missing protocol etc. — try to repair common cases
      try {
        const repaired = `https://${raw}`;
        new URL(repaired);
        return repaired;
      } catch {
        // fall through to default
      }
    }
  }
  return "https://kanhacloset.in";
}
