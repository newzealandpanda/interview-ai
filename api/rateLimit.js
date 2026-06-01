const requests = new Map();

const WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS = 10;

export function rateLimit(req, res) {
  const ip =
    req.headers["x-forwarded-for"]?.split(",")[0].trim() ||
    req.socket?.remoteAddress ||
    "unknown";

  const now = Date.now();
  const entry = requests.get(ip);

  if (!entry || now - entry.start > WINDOW_MS) {
    requests.set(ip, { start: now, count: 1 });
    return false;
  }

  entry.count += 1;

  if (entry.count > MAX_REQUESTS) {
    res.status(429).json({ error: "Too many requests. Please wait a minute." });
    return true;
  }

  return false;
}
