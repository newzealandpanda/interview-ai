export async function requireAuth(req, res) {
  const authHeader = req.headers["authorization"];
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized" });
    return null;
  }

  const token = authHeader.slice(7);

  try {
    const response = await fetch(
      `${process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL}/auth/v1/user`,
      {
        headers: {
          "Authorization": `Bearer ${token}`,
          "apikey": process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY,
        },
      }
    );

    if (!response.ok) {
      res.status(401).json({ error: "Invalid or expired token" });
      return null;
    }

    const user = await response.json();
    return user;
  } catch {
    res.status(401).json({ error: "Auth check failed" });
    return null;
  }
}
