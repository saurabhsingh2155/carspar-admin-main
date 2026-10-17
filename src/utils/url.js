export function toSafeHttpUrl(value) {
  try {
    const url = new URL(String(value || "").trim());
    return url.protocol === "https:" || url.protocol === "http:" ? url.href : null;
  } catch {
    return null;
  }
}

export function getYouTubeVideoId(value) {
  const safeUrl = toSafeHttpUrl(value);
  if (!safeUrl) return null;
  const url = new URL(safeUrl);
  const host = url.hostname.toLowerCase().replace(/^www\./, "");
  let id = null;

  if (host === "youtu.be") id = url.pathname.split("/").filter(Boolean)[0];
  if (host === "youtube.com" || host.endsWith(".youtube.com")) {
    id = url.searchParams.get("v");
    if (!id) {
      const parts = url.pathname.split("/").filter(Boolean);
      if (["embed", "shorts", "live"].includes(parts[0])) id = parts[1];
    }
  }

  return /^[A-Za-z0-9_-]{11}$/.test(id || "") ? id : null;
}
